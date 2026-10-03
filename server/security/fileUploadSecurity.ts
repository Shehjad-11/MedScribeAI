import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * File Upload Security & Temp-File Cleanup Module
 * Spec: MASTER_PROMPT Phase 11
 * Enforces strict MIME whitelist, size boundaries, magic-byte verification, and temp cleanup.
 */

export const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export type AllowedMimeType = (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFileName?: string;
  detectedMime?: string;
}

/**
 * Validates magic bytes / buffer header to verify actual file type matches claimed MIME.
 */
export function verifyBufferMagicBytes(buffer: Buffer): { matches: boolean; detectedMime?: string } {
  if (buffer.length < 4) {
    return { matches: false };
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { matches: true, detectedMime: 'image/png' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { matches: true, detectedMime: 'image/jpeg' };
  }

  // PDF: %PDF- (25 50 44 46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { matches: true, detectedMime: 'application/pdf' };
  }

  // WEBP: 'RIFF'....'WEBP'
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { matches: true, detectedMime: 'image/webp' };
  }

  return { matches: false };
}

/**
 * Strips path traversal characters, null bytes, and dangerous symbols from file name.
 */
export function sanitizeFileName(rawFileName: string): string {
  const base = path.basename(rawFileName);
  // Strip non-alphanumeric (except dot, dash, underscore) and null bytes
  return base.replace(/[\0\x00-\x1F\x7F-\x9F]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Validates uploaded document buffer against size limits, MIME whitelist, and magic bytes.
 */
export function validateUploadBuffer(
  buffer: Buffer,
  fileName: string,
  claimedMimeType: string
): UploadValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file buffer received' };
  }

  if (buffer.length > MAX_DOCUMENT_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 10 MB`,
    };
  }

  if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(claimedMimeType as AllowedMimeType)) {
    return {
      valid: false,
      error: `Disallowed MIME type '${claimedMimeType}'. Allowed types: ${ALLOWED_DOCUMENT_MIME_TYPES.join(', ')}`,
    };
  }

  const magicCheck = verifyBufferMagicBytes(buffer);
  if (!magicCheck.matches) {
    return {
      valid: false,
      error: 'File content does not match genuine image or PDF binary signature (magic bytes check failed)',
    };
  }

  // Ensure detected signature matches claimed type category (e.g. image vs pdf)
  if (magicCheck.detectedMime !== claimedMimeType) {
    return {
      valid: false,
      error: `MIME type mismatch: claimed '${claimedMimeType}' but binary header indicates '${magicCheck.detectedMime}'`,
    };
  }

  const sanitized = sanitizeFileName(fileName);
  return {
    valid: true,
    sanitizedFileName: sanitized,
    detectedMime: magicCheck.detectedMime,
  };
}

/**
 * Temporary file workspace manager for OCR and document transformations.
 */
const TEMP_DIR = path.join(process.cwd(), 'scratch', 'temp_uploads');

export function ensureTempDirExists(): string {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  return TEMP_DIR;
}

export interface TempFileHandle {
  filePath: string;
  fileName: string;
  cleanup: () => Promise<void>;
}

/**
 * Securely writes a temporary buffer to scratch disk and returns a cleanup handle.
 */
export async function createSecureTempFile(
  prefix: string,
  extension: string,
  buffer: Buffer
): Promise<TempFileHandle> {
  const dir = ensureTempDirExists();
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const safeExt = extension.startsWith('.') ? extension : `.${extension}`;
  const fileName = `${sanitizeFileName(prefix)}_${Date.now()}_${randomSuffix}${safeExt}`;
  const filePath = path.join(dir, fileName);

  await fs.promises.writeFile(filePath, buffer, { mode: 0o600 }); // Read/write only by owner

  return {
    filePath,
    fileName,
    cleanup: async () => {
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (err) {
        console.warn(`[TempCleanup] Failed to remove temp file ${filePath}:`, err);
      }
    },
  };
}

/**
 * Sweeper to clean up orphaned temp files older than maxAgeMs (default 15 mins).
 */
export async function cleanupOrphanedTempFiles(maxAgeMs = 15 * 60 * 1000): Promise<number> {
  const dir = ensureTempDirExists();
  let deletedCount = 0;
  const now = Date.now();

  try {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stats = await fs.promises.stat(fullPath);
        if (stats.isFile() && now - stats.mtimeMs > maxAgeMs) {
          await fs.promises.unlink(fullPath);
          deletedCount++;
        }
      } catch {
        // Ignore single file stat errors
      }
    }
  } catch (err) {
    console.warn('[TempCleanup] Error during orphaned temp file sweep:', err);
  }

  return deletedCount;
}
