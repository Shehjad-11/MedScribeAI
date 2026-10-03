# MedScribeAI — Phase 1 & Phase 1.5 Implementation Proposal (Phase 0 Audit)

**Inspection Date:** 2026-10-03  
**Auditor:** Lead Software & Healthcare Architect (Antigravity Agent)  
**Specification Reference:** `docs/MASTER_PROMPT.md` (Sections 0, 5, 16, 29, 39, 42, 43)

---

## 1. Executive Summary & Objective

Phase 1 establishes the central architectural foundation and **Security Skeleton** of MedScribeAI without breaking existing working features. Phase 1.5 immediately proves this foundation through an end-to-end, runnable vertical slice for a patient presenting with **Chest Pain** in English with one synthetic prescription document.

---

## 2. Phase 1: Core Foundation & Security Skeleton

### 2.1 Central Domain Model: `ClinicalCase`
The `ClinicalCase` object acts as the bridge connecting patient intake to clinician documentation.

```typescript
// Proposed location: src/types/clinicalCase.ts
export type CaseStatus = 
  | 'intake_draft'
  | 'patient_confirmed'
  | 'doctor_reviewing'
  | 'clinician_approved'
  | 'fhir_exported';

export type ProvenanceSource = 
  | 'patient_touch'
  | 'audio_transcript'
  | 'ocr_document'
  | 'clinician_edit'
  | 'offline_engine'
  | 'gemini_ai';

export interface ProvenanceRecord {
  source: ProvenanceSource;
  timestamp: string;
  confidence?: number;
  rawFragment?: string;
  verifiedByPatient: boolean;
  approvedByClinician: boolean;
}

export interface ClinicalFact<T = string> {
  value: T;
  provenance: ProvenanceRecord;
}

export interface PatientConsent {
  granted: boolean;
  timestamp: string;
  language: string;
  method: 'touch_checkbox' | 'verbal_recorded';
  version: string;
}

export interface RedFlagAlert {
  id: string;
  ruleId: string;
  severity: 'EMERGENCY' | 'URGENT' | 'WARNING';
  title: string;
  description: string;
  triggeredAt: string;
  actionRequired: string;
  acknowledgedByClinician: boolean;
}

export interface ClinicalCase {
  id: string; // e.g. case_1727938492_abc12
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  language: 'en' | 'hi' | 'mr';
  consent: PatientConsent;
  patient: {
    tempId: string;
    name: ClinicalFact<string>;
    age: ClinicalFact<number | string>;
    sex: ClinicalFact<'Male' | 'Female' | 'Other'>;
  };
  intake: {
    chiefComplaint: ClinicalFact<string>;
    symptomOnset: ClinicalFact<string>;
    questionResponses: Record<string, ClinicalFact<string | boolean>>;
    redFlags: RedFlagAlert[];
    pastMedicalHistory?: ClinicalFact<string>;
    currentMedications?: ClinicalFact<string[]>;
    allergies?: ClinicalFact<string[]>;
    ayushAssessment?: {
      prakriti?: ClinicalFact<string>;
      agni?: ClinicalFact<string>;
    };
  };
  documents: Array<{
    id: string;
    documentType: 'prescription' | 'lab_report';
    fileName: string;
    extractedPrescriptions: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      provenance: ProvenanceRecord;
    }>;
  }>;
  consultation?: {
    transcript?: string;
    soapNote?: SOAPNote;
    safetyAlerts?: SafetyAlert[];
    clinicianNotes?: string;
    approvedAt?: string;
    approvedBy?: string;
  };
  auditTrail: Array<{
    timestamp: string;
    action: string;
    actor: 'patient' | 'kiosk' | 'clinician' | 'system';
    details: string;
  }>;
}
```

### 2.2 Minimal Server Persistence (SQLite)
A local, file-backed SQLite database (`server/db/medscribe.db`) will replace reliance on insecure browser `localStorage`.
- **Database Driver:** `better-sqlite3` (fast, synchronous C-based SQLite bindings for Node.js).
- **Schema DDL:**
  ```sql
  -- server/db/schema.sql
  CREATE TABLE IF NOT EXISTS clinical_cases (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    patient_temp_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    data_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS kiosk_sessions (
    token TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    active_case_id TEXT,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS clinician_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'doctor'
  );

  CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    case_id TEXT,
    actor_type TEXT NOT NULL,
    actor_id TEXT,
    action TEXT NOT NULL,
    details_json TEXT
  );
  ```

### 2.3 Security Skeleton & API Contracts
To prevent cross-patient data leaks and unauthorized clinical edits:
1. **Namespace Separation:**
   - `/api/kiosk/*`: Accessible via short-lived, session-scoped kiosk tokens.
   - `/api/clinician/*`: Restricted via Bearer authentication; rejects kiosk tokens.
   - `/api/medscribe/*`: Preserved for backward-compatible standalone AI generation.
2. **Kiosk Session Lifecycle:**
   - `POST /api/kiosk/session/start` → Generates a random session token valid for 30 minutes.
   - `POST /api/kiosk/case` → Creates/updates the patient's draft `ClinicalCase`.
   - `POST /api/kiosk/case/confirm` → Patient confirms entered facts; case is locked from further kiosk edits and queued for clinician review.
   - `POST /api/kiosk/session/reset` → Immediately invalidates session token, wipes memory state, and triggers client cache flush.
3. **Clinician Workflow API:**
   - `POST /api/clinician/login` → Validates clinician credentials, returns session token.
   - `GET /api/clinician/queue` → Returns list of confirmed cases awaiting consultation.
   - `GET /api/clinician/cases/:id` → Retrieves full case data and provenance.
   - `POST /api/clinician/cases/:id/generate-soap` → Ingests `ClinicalCase` data directly into the existing Gemini/Offline SOAP pipeline.
   - `POST /api/clinician/cases/:id/approve` → Records formal doctor sign-off with audit logging.
   - `GET /api/clinician/cases/:id/fhir` → Dispatches existing FHIR converter on approved case.

---

## 3. Phase 1.5: Chest-Pain English Vertical Slice (Mandatory)

The vertical slice implements a single, complete patient-to-doctor journey before widening to other complaints or languages:

```
[PATIENT KIOSK]
1. Patient Consent (English)
2. Identity (Name: "Rajesh Sharma", Age: 52, Sex: Male)
3. Complaint: Chest Pain (Onset 2 hours ago, pressure-like, radiating to left arm)
4. Red Flag Triggered: Radiation to arm -> Immediate visual warning & triage flag
5. Document Upload: 1 Synthetic Prescription (Atorvastatin 20mg + Aspirin 75mg)
6. OCR/Extraction: Extracted medications mapped to ClinicalCase with provenance
7. Patient Review & Confirmation
      ↓
[SERVER-SIDE ISOLATION & QUEUE]
8. Case locked in SQLite as 'patient_confirmed'
9. Kiosk session reset (Patient A data wiped from client memory)
      ↓
[DOCTOR CONSOLE]
10. Doctor logs in and opens case from Queue
11. Pre-populated patient summary, history, and uploaded prescription displayed
12. Existing SOAP generation triggered (Gemini or Offline Fallback)
13. Deterministic Safety Engine verifies drug interactions & allergies
14. Doctor reviews, makes edits, and confirms approval
15. FHIR R4 Bundle exported with LOINC Composition & ICD-10 Condition (I20.9 / R07.9)
```

---

## 4. Phase Budget & Dependency Justification (Section 39)

### 4.1 Dependency Justification

| Proposed Package | Category | Runtime / Dev | Justification per Section 39 |
| :--- | :--- | :--- | :--- |
| `better-sqlite3` | Database | Runtime | **1. Purpose:** Embedded server-side database for `ClinicalCase` persistence, session state, and audit logs.<br>**2. Alternatives Considered:** `localStorage` (completely insecure for patient isolation); PostgreSQL (requires separate database container/service, failing rural local-first requirement).<br>**3. Bundle Impact:** 0 KB client bundle impact (server-side only).<br>**4. Offline Implications:** 100% file-backed local persistence.<br>**5. License:** MIT.<br>**6. Why existing stack cannot solve:** Current repo has zero server persistence. |
| Built-in `node:crypto` | Auth / Security | Runtime (0 npm package) | **Zero new package needed.** Use Node's built-in `crypto.randomBytes` and `crypto.createHmac` for token generation and password verification. Keeps runtime dependencies down to **1 new package total**. |

### 4.2 Code File Budget Check (Max 10 Code Files)

| # | File Path | Status | Purpose |
| :--- | :--- | :--- | :--- |
| 1 | `src/types/clinicalCase.ts` | New | `ClinicalCase` domain schema & provenance types |
| 2 | `src/types.ts` | Modify | Re-export and integrate with existing `SOAPNote` |
| 3 | `server/db/schema.sql` | New | DDL for SQLite tables |
| 4 | `server/db/database.ts` | New | SQLite connection and prepared statements |
| 5 | `server/security/auth.ts` | New | Kiosk token manager & clinician auth |
| 6 | `server.ts` | Modify | Mount `/api/kiosk` and `/api/clinician` routes |
| 7 | `src/services/api.ts` | New | Client-side API client for kiosk/clinician endpoints |
| 8 | `src/utils/provenance.ts` | New | Provenance helper utilities |

**Total Code Files Created/Modified in Phase 1:** **8 files (Under the <= 10 file budget).**  
**New Runtime Dependencies:** **1 package (`better-sqlite3`) (Under the <= 2 dependency budget).**  
**Architectural Changes:** **1 change (Server persistence & session isolation) (Under the <= 1 limit).**

---

## 5. Preservation of Existing Features

1. **SOAP Note Workspace (`src/components/SOAPNoteView.tsx`):** Untouched. Remains the primary clinician editing tool.
2. **Deterministic Safety Engine (`drugInteractionChecker.ts`):** Untouched. Reused identically for verifying prescriptions against `ClinicalCase` history.
3. **Gemini API Integration (`server.ts`):** Existing `/api/medscribe/generate` route remains fully intact.
4. **FHIR Converter (`fhirConverter.ts`):** Reused without breaking changes.
5. **Vitest Test Suite (46 Tests):** Continues to run and pass 100% on every commit.
