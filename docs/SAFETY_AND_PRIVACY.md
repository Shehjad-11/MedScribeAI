# MedScribeAI — Safety, Security & Privacy Specification

> **CRITICAL COMPLIANCE NOTICE**:
> **MedScribeAI is an academic demonstration and engineering evaluation platform developed for Smart India Hackathon (SIH 2026) and B.Tech CSE (AI & ML) evaluation.**
> **It is NOT certified under HIPAA (US Health Insurance Portability and Accountability Act), DISHA (Digital Information Security in Healthcare Act of India), ISO/IEC 27001, or GDPR.**
> **All data used in automated testing and demonstrations is 100% SYNTHETIC. No real Protected Health Information (PHI) or Personally Identifiable Information (PII) is collected, stored, or processed.**

---

## 1. Security Architecture & Controls: Implemented vs. Planned

| Security Domain | Control Implementation | Status | Enforcement Layer |
| :--- | :--- | :--- | :--- |
| **Data Encryption at Rest** | AES-256-GCM authenticated encryption for uploaded clinical documents and extraction payloads | **IMPLEMENTED** | `server/security/encryption.ts` |
| **Secret Management** | Zero client-side API keys; server-only `process.env.GEMINI_API_KEY` & credentials | **IMPLEMENTED** | `server.ts`, `.env.example` |
| **HTTP Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, strict CSP, `Referrer-Policy` | **IMPLEMENTED** | `server/security/securityHeaders.ts` |
| **Kiosk Rate Limiting** | Sliding-window in-memory rate limiter (60 req/min per client) with HTTP 429 & Retry-After | **IMPLEMENTED** | `server/security/rateLimiter.ts` |
| **Route Authorization (RBAC)** | Strict token segregation: kiosk token cannot access clinician routes (403); clinician token blocked from kiosk (403) | **IMPLEMENTED** | `server/security/auth.ts` |
| **Session Isolation & Wipe** | Session-scoped kiosk tokens with 30-min TTL; immediate wipe on session reset | **IMPLEMENTED** | `server/security/auth.ts`, `server/db/database.ts` |
| **Upload Validation & Magic Bytes** | MIME whitelist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`), 10MB limit, binary magic bytes verification | **IMPLEMENTED** | `server/security/fileUploadSecurity.ts` |
| **Temporary File Cleanup** | Scratch directory isolation, 0o600 file modes, immediate cleanup after OCR, and 15-min sweeper | **IMPLEMENTED** | `server/security/fileUploadSecurity.ts` |
| **Prompt Injection Fencing** | `<patient_demographics>` and `<clinical_transcript>` delimiters with strict system instruction guards | **IMPLEMENTED** | `server.ts` |
| **Audit Logging** | Immutable SQLite audit trail (`audit_events`) recording logins, consents, submissions, approvals | **IMPLEMENTED** | `server/db/database.ts` |
| **Dependency Security Audit** | `npm audit` scanning installed tree | **IMPLEMENTED** (0 vulnerabilities) | Node / npm package lock |
| **Hardware HSM Key Management** | KMS / AWS KMS / Cloud HSM integration for master encryption keys | *PLANNED (Production)* | Cloud KMS integration |
| **Mutual TLS (mTLS)** | Client-certificate mTLS for physical kiosk hardware communication | *PLANNED (Production)* | Infrastructure reverse proxy |
| **Biometric Clinician Auth** | FIDO2 / WebAuthn hardware security keys for prescribing clinicians | *PLANNED (Production)* | Auth0 / Keycloak integration |

---

## 2. Encryption at Rest Specification

- **Algorithm**: `AES-256-GCM` (Galois/Counter Mode) authenticated encryption.
- **Key Derivation**: Keys are derived from `process.env.DOC_ENCRYPTION_KEY` via `scrypt` using a 16-byte salt (`medscribe-doc-enc-salt-v1`).
- **Initialization Vector**: Cryptographically secure 12-byte (96-bit) IV generated per encrypted document.
- **Authentication Tag**: 16-byte (128-bit) GCM authentication tag attached to detect any ciphertext tampering.
- **Payload Format**: `enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>`.
- **Integrity**: Any bit flip or modification in ciphertext or IV immediately fails decryption and throws an unauthenticated payload error.

---

## 3. Upload & File Processing Safeguards

1. **Size Boundary**: Hard cap at 10 MB per file.
2. **MIME Verification**: Strictly limited to `image/jpeg`, `image/png`, `image/webp`, and `application/pdf`.
3. **Magic Byte Verification**: File headers are inspected at the binary level:
   - PNG: `89 50 4E 47`
   - JPEG: `FF D8 FF`
   - PDF: `%PDF-` (`25 50 44 46`)
   - WEBP: `RIFF....WEBP`
   Disguised executables or scripts with forged `.png` or `.pdf` extensions are blocked with `400 Bad Request`.
4. **File Name Sanitization**: Path traversal sequences (`../`, `..\\`), null bytes (`\0`), and non-alphanumeric characters are stripped before processing.
5. **Temporary Files**: Created with restricted Unix permissions (`0600`), processed in isolated workspaces, and wiped immediately upon completion.

---

## 4. Route Authorization & Token Segregation Matrix

| Route Pattern | Public / No Token | Kiosk Session Token | Clinician Session Token |
| :--- | :--- | :--- | :--- |
| `POST /api/kiosk/session/start` | **201 Created** | **201 Created** | **201 Created** |
| `POST /api/kiosk/session/reset` | 401 Unauthorized | **200 OK** | 403 Forbidden |
| `GET /api/kiosk/case` | 401 Unauthorized | **200 OK** | 403 Forbidden |
| `POST /api/kiosk/documents/upload` | 401 Unauthorized | **201 Created** | 403 Forbidden |
| `POST /api/clinician/login` | **200 OK** (with credentials) | **200 OK** (with credentials) | **200 OK** |
| `GET /api/clinician/queue` | 401 Unauthorized | **403 Forbidden** | **200 OK** |
| `GET /api/clinician/cases/:id/documents`| 401 Unauthorized | **403 Forbidden** | **200 OK** |
| `POST /api/clinician/cases/:id/approve` | 401 Unauthorized | **403 Forbidden** | **200 OK** |

---

## 5. Dependency Audit Report (`npm audit`)

Audit executed on `2026-10-03`:
```text
found 0 vulnerabilities
```
Zero high, critical, or moderate vulnerabilities exist across the active dependency tree.
