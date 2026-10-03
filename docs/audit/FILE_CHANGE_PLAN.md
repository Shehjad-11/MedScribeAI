# MedScribeAI — File Change Plan (Phase 0 Audit)

**Inspection Date:** 2026-10-03  
**Auditor:** Lead Software & Healthcare Architect (Antigravity Agent)  
**Specification Reference:** `docs/MASTER_PROMPT.md` (Sections 38, 39, 42, 43)

---

## 1. Governance & Constraints

Per Section 39 of the Master Prompt:
- **Maximum 10 newly created/majorly modified CODE files per implementation phase.**
- **Maximum 2 new runtime dependencies per phase.**
- **Maximum 1 architectural change per phase.**
- **Zero modification of application code during this audit.**

The following table categorizes all proposed file changes across Phase 1 (Foundation & Security Skeleton), Phase 1.5 (Vertical Slice MVP), and subsequent phases.

---

## 2. File Change Plan Table

| File Path | Action | Reason | Existing Behavior Affected? | Test Required? | Phase |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/types/clinicalCase.ts` | Create | Central domain model defining `ClinicalCase`, `ProvenanceRecord`, `ConsentRecord`, `AuditTrail`, and case lifecycle states (`intake_draft`, `patient_confirmed`, `doctor_reviewing`, `clinician_approved`, `fhir_exported`). | No (New domain type file). | TypeScript compilation (`tsc --noEmit`). | Phase 1 |
| `src/types.ts` | Modify | Re-export `ClinicalCase` types and link `EncounterRecord` / `SOAPNote` to `ClinicalCase` ID to preserve backwards compatibility. | No (Backwards-compatible union/optional fields). | Typecheck (`tsc --noEmit`) and existing component tests. | Phase 1 |
| `server/db/schema.sql` | Create | DDL definitions for SQLite tables: `clinical_cases`, `patient_sessions`, `audit_events`, `curated_interactions`. | No (New database layer). | Schema initialization test. | Phase 1 |
| `server/db/database.ts` | Create | Minimal SQLite persistence engine (using `better-sqlite3` or standard file-backed driver) with prepared statements for atomic reads/writes. | No (New server module). | Database unit tests (CRUD, session isolation). | Phase 1 |
| `server/security/auth.ts` | Create | Security skeleton: generates session-scoped kiosk tokens (`Bearer kiosk-...`), validates clinician credentials, manages server-side session expiry. | No (New middleware). | Auth unit test (kiosk cannot access clinician route). | Phase 1 |
| `server.ts` | Modify | Mount separate API namespaces (`/api/kiosk/*` and `/api/clinician/*`), integrate security middleware, and add session reset endpoint. Keep existing `/api/medscribe/generate` intact. | No (Existing endpoints preserved as legacy fallback). | API regression tests (`npm test`). | Phase 1 |
| `src/services/api.ts` | Create | Client API wrapper handling kiosk session tokens, clinician auth headers, and typed `ClinicalCase` fetches. | No (New client service layer). | API client mock tests. | Phase 1 |
| `src/utils/provenance.ts` | Create | Helper utilities for generating and attaching `ProvenanceRecord` (source: `patient_touch`, `audio_transcript`, `ocr_document`, `clinician_edit`). | No (New pure TS utility). | Unit tests (`provenance.test.ts`). | Phase 1 |
| `src/__tests__/securitySkeleton.test.ts` | Create | Automated security tests proving: 1) kiosk token rejected from clinician API; 2) unauthenticated requests rejected; 3) session reset wipes patient data. | No (New test file). | Vitest execution (`npm test`). | Phase 1 |
| `src/data/chestPainTemplate.ts` | Create | Question graph and red-flag rules for the chest-pain English vertical slice. | No (New data fixture). | Unit tests on rule firing. | Phase 1.5 |
| `src/components/kiosk/ChestPainIntake.tsx` | Create | Vertical-slice patient intake screen (consent, name/age, chest pain questions, red-flag check, prescription photo capture). | No (New component). | React Testing Library component tests. | Phase 1.5 |
| `src/components/kiosk/PatientConfirmation.tsx` | Create | Patient review screen showing entered facts with confirmation checkbox before submission. | No (New component). | Component interaction test. | Phase 1.5 |
| `src/components/doctor/CaseQueueView.tsx` | Create | Doctor queue showing incoming `ClinicalCase` summaries ready for doctor consultation. | No (New component). | Component interaction test. | Phase 1.5 |
| `src/utils/prescriptionExtractor.ts` | Create | Deterministic/multimodal extractor transforming synthetic prescription photo to structured prescription object with provenance. | No (New utility). | Extractor unit test with synthetic fixture. | Phase 1.5 |
| `src/data/syntheticPrescriptions/chestPainRx.png` | Create | Synthetic, anonymized prescription image fixture for end-to-end vertical-slice testing. | No (Test fixture). | Visual / OCR test. | Phase 1.5 |
| `src/__tests__/chestPainVerticalSlice.test.tsx` | Create | End-to-end integration test running: consent → chest pain intake → prescription upload → ClinicalCase → doctor view → SOAP → safety → clinician approval → FHIR. | No (New test suite). | Vitest execution (`npm test`). | Phase 1.5 |
| `src/App.tsx` | Modify | Add top-level mode/route toggle between Kiosk Intake, Doctor Workstation, and Landing Page, ensuring session wipe on reset. | Minor (Routes integrated into top navigation; existing workstation view untouched). | Component smoke and regression tests. | Phase 1.5 |
| `src/i18n/locales/hi.ts` | Create | Hindi translation dictionary for UI chrome and kiosk patient intake. | No (New locale file). | i18n test. | Phase 2 |
| `src/i18n/locales/mr.ts` | Create | Marathi translation dictionary for UI chrome and kiosk patient intake. | No (New locale file). | i18n test. | Phase 2 |
| `src/i18n/LanguageContext.tsx` | Modify | Add `'hi'` and `'mr'` to `SupportedLanguage` union. | No (Additive change). | Multi-language test. | Phase 2 |
| `src/data/complaintTemplates.ts` | Create | Ten standardized complaint templates and deterministic clinical question graphs. | No (New data module). | Graph validation tests. | Phase 2 |
| `src/data/ayush/prakritiAgniRules.ts` | Create | Clinically validated BAMS-reviewed Prakriti and Agni assessment question set and rule logic. | No (New data module). | Expert-reviewed test cases. | Phase 2 |
| `src/utils/redFlagEngine.ts` | Create | Deterministic clinical red-flag engine for acute symptoms (chest pain, severe dyspnea, neurological signs). | No (New utility). | Rule coverage unit tests. | Phase 2 |
| `src/utils/fhirConverter.ts` | Modify | Extend converter to map `ClinicalCase` structured fields and provenance extensions into FHIR R4 Bundle. | No (Preserves existing `exportToFHIRBundle` function signature). | Regression test against existing 6 FHIR tests. | Phase 3 |
| `src/components/BillingCodingPanel.tsx` | Modify | Add feature flag to isolate US CPT codes behind legacy/optional toggle; preserve ICD-10. | Minor (CPT can be collapsed by default). | Component test. | Phase 3 |

---

## 3. Phase Budget Compliance Summary

### Phase 1 Budget Check:
- **Code Files Created/Modified:** 8 files (`src/types/clinicalCase.ts`, `src/types.ts`, `server/db/schema.sql`, `server/db/database.ts`, `server/security/auth.ts`, `server.ts`, `src/services/api.ts`, `src/utils/provenance.ts`) + 1 test file (`src/__tests__/securitySkeleton.test.ts`). **Total code files: 8 (<= 10 budget limit).**
- **New Runtime Dependencies:** 2 (`better-sqlite3` or SQLite driver, `jsonwebtoken` or `crypto` helper). **(<= 2 budget limit).**
- **Architectural Changes:** 1 (Introduce server-side SQLite persistence & session isolation). **(<= 1 budget limit).**
- **Existing Working Features Affected:** **None.** Existing `/api/medscribe/generate` and workstation UI continue functioning identically.
