// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import http from 'http';
import fs from 'node:fs';
import path from 'node:path';
import { getDatabase, closeDatabase } from '../../server/db/database';
import { createKioskRouter } from '../../server/routes/kioskRoutes';
import { createClinicianRouter } from '../../server/routes/clinicianRoutes';
import { securityHeadersMiddleware } from '../../server/security/securityHeaders';
import { InMemoryRateLimiter } from '../../server/security/rateLimiter';
import { encryptPayload, decryptPayload, isEncrypted } from '../../server/security/encryption';
import {
  validateUploadBuffer,
  createSecureTempFile,
  sanitizeFileName,
  verifyBufferMagicBytes,
} from '../../server/security/fileUploadSecurity';

describe('Phase 11: Security Hardening & Authorization Matrix', () => {
  let server: http.Server;
  let baseUrl: string;
  let testRateLimiter: InMemoryRateLimiter;

  beforeEach(async () => {
    process.env.MEDSCRIBE_DB_PATH = ':memory:';
    process.env.CLINICIAN_USER = 'testdoc';
    process.env.CLINICIAN_PASS = 'DocSecurePass2026!';
    process.env.DOC_ENCRYPTION_KEY = 'test-aes-key-for-vitest-suite-32b!!';

    const db = getDatabase(':memory:');
    const app = express();

    testRateLimiter = new InMemoryRateLimiter({ windowMs: 10000, maxRequests: 5 });

    app.use(securityHeadersMiddleware);
    app.use(express.json({ limit: '50mb' }));
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') return res.sendStatus(200);
      next();
    });

    app.use('/api/kiosk', testRateLimiter.getMiddleware(), createKioskRouter(() => db));
    app.use('/api/clinician', createClinicianRouter(() => db));

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    closeDatabase();
  });

  // 1. AES-256-GCM Encryption at Rest
  describe('1. Authenticated Encryption at Rest (AES-256-GCM)', () => {
    it('encrypts clinical document payloads to authenticated format and decrypts accurately', () => {
      const sensitiveData = {
        patientName: 'Synthetic Patient 52',
        diagnosis: 'Acute Coronary Syndrome',
        prescribedMeds: ['Aspirin 75mg', 'Atorvastatin 20mg'],
      };

      const encrypted = encryptPayload(sensitiveData);
      expect(isEncrypted(encrypted)).toBe(true);
      expect(encrypted).toMatch(/^enc:v1:[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/);

      const decrypted = decryptPayload<typeof sensitiveData>(encrypted);
      expect(decrypted.patientName).toBe('Synthetic Patient 52');
      expect(decrypted.prescribedMeds).toEqual(['Aspirin 75mg', 'Atorvastatin 20mg']);
    });

    it('rejects tampered or corrupted ciphertext with an error', () => {
      const encrypted = encryptPayload('Confidential Lab Report');
      const parts = encrypted.split(':');
      // Tamper with the ciphertext component
      parts[4] = 'ff' + parts[4].slice(2);
      const tampered = parts.join(':');

      expect(() => decryptPayload(tampered)).toThrow();
    });
  });

  // 2. Upload Validation, Magic Bytes & Temp-File Cleanup
  describe('2. Upload Validation, Magic Bytes & Temp-File Cleanup', () => {
    it('verifies genuine PNG, JPEG, and PDF magic bytes headers', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>');

      expect(verifyBufferMagicBytes(pngBuffer)).toEqual({ matches: true, detectedMime: 'image/png' });
      expect(verifyBufferMagicBytes(jpegBuffer)).toEqual({ matches: true, detectedMime: 'image/jpeg' });
      expect(verifyBufferMagicBytes(pdfBuffer)).toEqual({ matches: true, detectedMime: 'application/pdf' });
    });

    it('rejects files claiming to be images but lacking genuine binary magic bytes', () => {
      const fakeImage = Buffer.from('malicious_executable_disguised_as_png');
      const res = validateUploadBuffer(fakeImage, 'document.png', 'image/png');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('magic bytes check failed');
    });

    it('rejects files exceeding 10 MB threshold', () => {
      const oversized = Buffer.alloc(11 * 1024 * 1024);
      const res = validateUploadBuffer(oversized, 'huge.pdf', 'application/pdf');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('exceeds maximum allowed limit');
    });

    it('sanitizes dangerous path-traversal filenames', () => {
      expect(sanitizeFileName('../../etc/shadow.pdf')).toBe('shadow.pdf');
      expect(sanitizeFileName('..\\..\\windows\\system32\\config.png')).toBe('config.png');
      expect(sanitizeFileName('report;rm -rf.jpg')).toBe('report_rm_-rf.jpg');
    });

    it('creates temporary files in isolated scratch space and cleanly unlinks them', async () => {
      const testBuffer = Buffer.from('temp file content for ocr');
      const handle = await createSecureTempFile('test_doc', '.tmp', testBuffer);

      expect(fs.existsSync(handle.filePath)).toBe(true);
      await handle.cleanup();
      expect(fs.existsSync(handle.filePath)).toBe(false);
    });
  });

  // 3. Rate Limiting Middleware
  describe('3. Kiosk Rate Limiting', () => {
    it('allows requests below threshold and rejects bursts with HTTP 429 and Retry-After', async () => {
      const limiter = new InMemoryRateLimiter({ windowMs: 10000, maxRequests: 3 });
      const limiterApp = express();
      limiterApp.use(limiter.getMiddleware());
      limiterApp.get('/test', (_req, res) => res.json({ ok: true }));

      const testServer = limiterApp.listen(0);
      const port = (testServer.address() as any).port;
      const url = `http://127.0.0.1:${port}/test`;

      // 3 successful requests
      for (let i = 0; i < 3; i++) {
        const res = await fetch(url);
        expect(res.status).toBe(200);
      }

      // 4th request must be blocked
      const blockedRes = await fetch(url);
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get('Retry-After')).toBeDefined();

      const body = await blockedRes.json();
      expect(body.error).toBe('Too Many Requests');

      testServer.close();
    });
  });

  // 4. Security Headers Verification
  describe('4. Security Headers Defense-in-Depth', () => {
    it('sets hardened HTTP security headers on all responses and strips X-Powered-By', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/config`);
      expect(res.headers.get('x-content-type-options')).toBe('nosniff');
      expect(res.headers.get('x-frame-options')).toBe('DENY');
      expect(res.headers.get('x-xss-protection')).toBe('0');
      expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
      expect(res.headers.get('content-security-policy')).toBeDefined();
      expect(res.headers.get('x-powered-by')).toBeNull();
    });
  });

  // 5. Authorization Matrix (Every Route Role Check)
  describe('5. Comprehensive Route Authorization & Role Segregation Matrix', () => {
    let kioskToken: string;
    let clinicianToken: string;

    beforeEach(async () => {
      // 1. Create kiosk session
      const kRes = await fetch(`${baseUrl}/api/kiosk/session/start`, { method: 'POST' });
      const kData = await kRes.json();
      kioskToken = kData.token;

      // 2. Clinician login
      const docRes = await fetch(`${baseUrl}/api/clinician/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testdoc', password: 'DocSecurePass2026!' }),
      });
      const docData = await docRes.json();
      clinicianToken = docData.token;
    });

    it('requires authentication for clinician queue (no token -> 401)', async () => {
      const res = await fetch(`${baseUrl}/api/clinician/queue`);
      expect(res.status).toBe(401);
    });

    it('strictly forbids kiosk tokens on clinician endpoints (kiosk token -> 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/clinician/queue`, {
        headers: { Authorization: `Bearer ${kioskToken}` },
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Forbidden');
    });

    it('permits authorized clinician on clinician queue (clinician token -> 200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/clinician/queue`, {
        headers: { Authorization: `Bearer ${clinicianToken}` },
      });
      expect(res.status).toBe(200);
    });

    it('requires authentication for kiosk case inspection (no token -> 401)', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/case`);
      expect(res.status).toBe(401);
    });

    it('strictly forbids clinician tokens on kiosk endpoints (clinician token -> 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/case`, {
        headers: { Authorization: `Bearer ${clinicianToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('invalidates reset tokens immediately (reused token -> 401)', async () => {
      // Reset kiosk session
      const resetRes = await fetch(`${baseUrl}/api/kiosk/session/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${kioskToken}` },
      });
      expect(resetRes.status).toBe(200);

      // Reused token must be rejected
      const reusedRes = await fetch(`${baseUrl}/api/kiosk/case`, {
        headers: { Authorization: `Bearer ${kioskToken}` },
      });
      expect(reusedRes.status).toBe(401);
    });
  });

  // 6. Encrypted Document Upload and Clinician Decryption Retrieval
  describe('6. End-to-End Encrypted Document Pipeline', () => {
    it('uploads a document, encrypts at rest in SQLite, and provides decrypted view to clinician', async () => {
      // 1. Start kiosk session and init draft case
      const startRes = await fetch(`${baseUrl}/api/kiosk/session/start`, { method: 'POST' });
      const { token } = await startRes.json();

      const caseId = 'case_sec_eval_001';
      await fetch(`${baseUrl}/api/kiosk/case`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: caseId,
          status: 'intake_draft',
          patient: {
            tempId: 'P_SEC_001',
            name: { value: 'Encrypted Patient' },
            age: { value: 45 },
            sex: { value: 'Female' },
          },
          intake: {
            chiefComplaint: { value: 'Chest pain' },
            questionResponses: {},
          },
        }),
      });

      // 2. Upload document via kiosk route (valid PNG header)
      const pngPayload = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      ]).toString('base64');

      const uploadRes = await fetch(`${baseUrl}/api/kiosk/documents/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: 'prescription_scan.png',
          mimeType: 'image/png',
          fileBase64: pngPayload,
          documentType: 'prescription',
          ocrRawText: 'Amlodipine 5mg OD',
          extractedData: { medication: 'Amlodipine', dose: '5mg' },
        }),
      });

      expect(uploadRes.status).toBe(201);
      const uploadData = await uploadRes.json();
      expect(uploadData.success).toBe(true);
      expect(uploadData.encryptedAtRest).toBe(true);

      // 3. Confirm case
      await fetch(`${baseUrl}/api/kiosk/case/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      // 4. Authenticate as clinician
      const docRes = await fetch(`${baseUrl}/api/clinician/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testdoc', password: 'DocSecurePass2026!' }),
      });
      const { token: docToken } = await docRes.json();

      // 5. Fetch documents as clinician
      const docListRes = await fetch(`${baseUrl}/api/clinician/cases/${caseId}/documents`, {
        headers: { Authorization: `Bearer ${docToken}` },
      });
      expect(docListRes.status).toBe(200);
      const docListData = await docListRes.json();
      expect(docListData.count).toBe(1);
      expect(docListData.documents[0].decryptedForClinician).toBe(true);
      expect(docListData.documents[0].extractedData.extractedData.medication).toBe('Amlodipine');
    });
  });
});
