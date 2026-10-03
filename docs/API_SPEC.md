# MedScribeAI — API Specification & Security Contract
**Version:** 1.0 (Phase 1 Baseline)  
**Status:** Implemented & Verified  
**Audience:** Frontend Engineers, Healthcare Integration Architects, Security Evaluators

---

## 1. Architectural Overview & Security Boundary

MedScribeAI implements a strict **Namespace Separation & Session Isolation** model to guarantee patient privacy on shared clinic hardware (e.g. tablet kiosks, intake terminals):

1. **/api/kiosk/***: Dedicated to patient-facing intake.
   - Requires `Authorization: Bearer kiosk_<random_hex>`
   - Session lifetime: 30 minutes (auto-invalidation on timeout)
   - Scope: strictly restricted to creating and modifying the patient's own draft `ClinicalCase`.
   - Cannot read other patients' records.
   - **STRICT PROHIBITION:** Kiosk tokens attempting to access `/api/clinician/*` receive an immediate `403 Forbidden` response and an audit security violation event is recorded.

2. **/api/clinician/***: Dedicated to authenticated doctors and medical staff.
   - Requires `Authorization: Bearer doc_<random_hex>`
   - Session lifetime: 8 hours
   - Scope: full access to triage queue, ClinicalCase reviews, SOAP notes, clinician approval sign-off, FHIR exports, and audit logs.
   - Rejects unauthenticated requests with `401 Unauthorized`.

3. **/api/medscribe/***: Preserved backward-compatible downstream AI generation bridge.

---

## 2. Authentication & Session Lifecycles

### Token Headers
All authenticated API calls must transmit the token in the standard HTTP header:
```http
Authorization: Bearer <token>
```

### Kiosk Session Wipe & Reset Flow
1. Patient arrives at kiosk: Client calls `POST /api/kiosk/session/start` to obtain a session token.
2. Patient completes intake: Case is submitted via `POST /api/kiosk/case/confirm`.
3. Kiosk reset: Client calls `POST /api/kiosk/session/reset`.
4. Server immediately invalidates the token in SQLite (`is_active = 0`) and unlinks the case.
5. Even if the same browser device is used by Patient B, any attempt to reuse Patient A's token or retrieve Patient A's case returns `401 Unauthorized` / `404 Not Found`.

---

## 3. Kiosk Endpoints (`/api/kiosk/*`)

### 3.1 Start Kiosk Session
- **Route:** `POST /api/kiosk/session/start`
- **Auth:** Public / Unauthenticated
- **Response (201 Created):**
```json
{
  "token": "kiosk_9a8f3b2c1d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6",
  "expiresAt": "2026-10-03T15:00:00.000Z"
}
```

### 3.2 Reset Kiosk Session
- **Route:** `POST /api/kiosk/session/reset`
- **Auth:** Bearer `kiosk_*`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Kiosk session successfully wiped and reset"
}
```

### 3.3 Record Patient Consent
- **Route:** `POST /api/kiosk/consent`
- **Auth:** Bearer `kiosk_*`
- **Request Body:**
```json
{
  "patientId": "pt_temp_521",
  "granted": true,
  "language": "en",
  "method": "touch_checkbox",
  "version": "1.0",
  "scopes": {
    "historyCollection": true,
    "voiceRecording": false,
    "documentProcessing": true,
    "cloudAI": true,
    "interoperabilityFHIR": true
  }
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "consentId": "consent_1727938492000_abc1",
  "granted": true
}
```

### 3.4 Save Draft ClinicalCase
- **Route:** `POST /api/kiosk/case`
- **Auth:** Bearer `kiosk_*`
- **Request Body:** `ClinicalCase` JSON object (see Section 5 schema)
- **Response (200 OK):**
```json
{
  "success": true,
  "caseId": "case_1727938492000_xy78",
  "status": "intake_draft"
}
```

### 3.5 Get Active Case for Session
- **Route:** `GET /api/kiosk/case`
- **Auth:** Bearer `kiosk_*`
- **Response (200 OK):**
```json
{
  "case": {
    "id": "case_1727938492000_xy78",
    "status": "intake_draft",
    ...
  }
}
```
- **Error (404 Not Found):** If session has no active case or case was wiped.

### 3.6 Confirm & Submit Case
- **Route:** `POST /api/kiosk/case/confirm`
- **Auth:** Bearer `kiosk_*`
- **Response (200 OK):**
```json
{
  "success": true,
  "caseId": "case_1727938492000_xy78",
  "status": "patient_confirmed"
}
```

---

## 4. Clinician Endpoints (`/api/clinician/*`)

### 4.1 Clinician Login
- **Route:** `POST /api/clinician/login`
- **Auth:** Public
- **Request Body:**
```json
{
  "username": "doctor",
  "password": "medscribe2026"
}
```
- **Response (200 OK):**
```json
{
  "token": "doc_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f",
  "expiresAt": "2026-10-03T22:30:00.000Z",
  "displayName": "Dr. Primary Care"
}
```

### 4.2 Clinician Queue
- **Route:** `GET /api/clinician/queue`
- **Query Params:** `?status=patient_confirmed` (optional)
- **Auth:** Bearer `doc_*`
- **Response (200 OK):**
```json
{
  "count": 1,
  "queue": [
    {
      "id": "case_1727938492000_xy78",
      "status": "patient_confirmed",
      "patientName": "Rajesh Sharma",
      "age": 52,
      "sex": "Male",
      "chiefComplaint": "Chest Pain",
      "language": "en",
      "hasRedFlags": true,
      "redFlagsCount": 1,
      "createdAt": "2026-10-03T14:30:00.000Z",
      "updatedAt": "2026-10-03T14:35:00.000Z"
    }
  ]
}
```

### 4.3 Get Full Case
- **Route:** `GET /api/clinician/cases/:id`
- **Auth:** Bearer `doc_*`
- **Response (200 OK):** Full `ClinicalCase` document including all provenance records.

### 4.4 Update Case Status
- **Route:** `POST /api/clinician/cases/:id/status`
- **Auth:** Bearer `doc_*`
- **Request Body:** `{"status": "doctor_reviewing"}`
- **Response (200 OK):** `{"success": true, "caseId": "...", "status": "doctor_reviewing"}`

### 4.5 Clinician Approval Sign-Off
- **Route:** `POST /api/clinician/cases/:id/approve`
- **Auth:** Bearer `doc_*`
- **Request Body:**
```json
{
  "approvedBy": "Dr. A. Verma, MBBS",
  "clinicianNotes": "Verified medications and stable ECG. Prescribed sublingual nitrates."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "caseId": "case_1727938492000_xy78",
  "status": "clinician_approved",
  "approvedAt": "2026-10-03T14:40:00.000Z"
}
```

### 4.6 Record FHIR Export
- **Route:** `POST /api/clinician/cases/:id/fhir-export`
- **Auth:** Bearer `doc_*`
- **Response (200 OK):**
```json
{
  "success": true,
  "caseId": "case_1727938492000_xy78",
  "status": "fhir_exported"
}
```

### 4.7 View Minimal Audit Events
- **Route:** `GET /api/clinician/audit-events`
- **Query Params:** `?caseId=...` (optional)
- **Auth:** Bearer `doc_*`
- **Response (200 OK):**
```json
{
  "count": 4,
  "events": [
    {
      "id": "audit_1727938492000_1a2b",
      "case_id": null,
      "actor_type": "kiosk",
      "actor_id": "kiosk_...",
      "action": "SESSION_CREATED",
      "details_json": "{\"expiresAt\":\"...\"}",
      "timestamp": "2026-10-03T14:25:00.000Z"
    },
    {
      "id": "audit_1727938493000_3c4d",
      "case_id": "case_1727938492000_xy78",
      "actor_type": "patient",
      "actor_id": "pt_temp_521",
      "action": "CONSENT_RECORDED",
      "details_json": "{\"granted\":true}",
      "timestamp": "2026-10-03T14:26:00.000Z"
    }
  ]
}
```

---

## 5. Domain Schemas

### ClinicalFact Provenance Schema
Every clinically meaningful fact in `ClinicalCase` contains provenance metadata:
```typescript
interface ProvenanceRecord {
  source: 'PATIENT_REPORTED' | 'CLINICIAN_OBSERVED' | 'DOCUMENT_EXTRACTED' | 'AI_GENERATED' | 'CLINICIAN_VERIFIED';
  confidence?: number; // 0.0 to 1.0
  timestamp: string; // ISO 8601
  method: 'touch' | 'voice_asr' | 'ocr' | 'doctor_entry' | 'rule_engine' | 'llm_extraction' | 'manual_entry';
  verificationState: 'unverified' | 'patient_confirmed' | 'clinician_verified' | 'rejected';
  rawFragment?: string;
  verifiedBy?: string;
}
```

---

## 6. HTTP Status Code Conventions
| Code | Meaning | When Returned |
|:---|:---|:---|
| **200 OK** | Success | Successful read or update |
| **201 Created** | Created | Successful session start, consent recording, or case initialization |
| **400 Bad Request** | Validation Failure | Missing required fields, invalid JSON, or empty payload |
| **401 Unauthorized** | Missing/Invalid Token | Missing `Bearer` token, invalid token, or expired session |
| **403 Forbidden** | Role / Boundary Violation | **Kiosk token attempted to call clinician API**, or attempted to mutate a case outside session scope |
| **404 Not Found** | Resource Missing | Non-existent case ID or expired session with no active case |
| **500 Server Error** | Internal Failure | SQLite or runtime exception |
