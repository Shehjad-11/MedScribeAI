# Project Progress Tracker (todo.md)

**Last updated:** 2026-07-31

*Refer to `phases.md` for full phase details, descriptions, and exit criteria.*

---

## Phase 0: Governance Setup (Completed)
- [x] Analyze existing codebase stack (`package.json`, `server.ts`, `src/App.tsx`, `SOAPNoteView.tsx`, etc.)
- [x] Create 11 root governance files (`system-instructions.md`, `todo.md`, `architecture.md`, `ui-dna.md`, `dependency-lockbase.md`, `project-context.md`, `prd.md`, `rules.md`, `phases.md`, `design.md`, `memory.md`)
- [x] Log Phase 0 completion in `memory.md`

---

## Phase 1: Startup-Polish & De-Hackathon-ify (Completed)
- [x] Rename `package.json` project name from `react-example` to `medscribe-lite`
- [x] Integrate `motion` sub-200ms enter/exit transitions across all modals (`EncounterHistoryModal`, `PrintPrescriptionModal`, `ClinicAnalyticsModal`)
- [x] Implement accessibility focus trap, Escape key closing, ARIA tags (`aria-modal`, `aria-labelledby`), and visible focus rings
- [x] Add skeleton-loading states for `TranscriptInput` and `SOAPNoteView` during AI note generation
- [x] Upgrade `SafetyAlertsPanel` alert cards with motion spring hover/focus states and high-severity glowing indicators
- [x] Update `index.html` title from `My Google AI Studio App` to `MedScribe Lite — AI Clinical Assistant`
- [x] Clean `src/components/Header.tsx`: remove model version badge (`Gemini 3.6 Engine`) and stray `Bento AI` tag
- [x] Rewrite `README.md` to professional startup standards
- [x] Create repository metadata files (`LICENSE`, `SECURITY.md`, `CHANGELOG.md`)
- [x] Document environment variable requirements (`.env.example` audit)
- [x] Audit UI empty states, error fallbacks, and loading indicators across all components

---

## Phase 2: Code Quality & Refactoring (Completed)
- [x] Refactor `src/components/SOAPNoteView.tsx` (772 lines) into modular subcomponents inside `src/components/soap-note/`
- [x] Define concrete design tokens in `ui-dna.md` (colors, typography scale, spacing scale, component variants)
- [x] Wire design tokens into Tailwind CSS v4 config (`src/index.css`)
- [x] Systematically refactor all components across `src/components/` to use token-based classes
- [x] Set up automated unit/component test harness (`vitest` + `@testing-library/react`)
- [x] Resolve Vitest worker startup CI crash by switching test environment from `jsdom` to `happy-dom`
- [x] Configure CI/CD check pipeline (`.github/workflows/ci.yml`)
- [x] Reconcile `dependency-lockbase.md` tables with `package.json` (added missing devDependencies: `jsdom`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `happy-dom`)

---

## Phase 3: Positioning & Launch Assets
- [x] Lock target customer segment to Small Independent Clinics & Community Health Centers in `project-context.md`
- [x] Define concrete 3-tier pricing structure (₹0 Free / ₹199 Clinic / ₹499 Multi-Provider) in `prd.md`
- [x] Execute UI copy pass in `Header.tsx`, `App.tsx`, and `TranscriptInput.tsx` to highlight "Clinical Safety Copilot" positioning
- [x] Design standalone product marketing landing page (`src/components/LandingPage.tsx`) with hero positioning, problem grid, Bento product preview, 3 pricing tiers, and request access CTA form
- [ ] Generate high-impact product screenshots and visual assets
- [ ] Finalize startup positioning documentation

---

## Phase 4: Feature Backlog
- [x] Multi-language consultation input & translation support (UI chrome localized to English/Spanish via custom React Context dictionary)
- [x] FHIR JSON export integration
- [x] Real-time drug-drug interaction database lookup
- [x] Documentation Confidence scoring per SOAP section (Subjective, Objective, Assessment, Plan metrics with reasoning tooltips)
- [x] Offline/local-model mode (Browser-local clinical NLP fallback engine & mode toggle)

---

## Phase 5: Hardening
- [x] Conduct initial Security Review (npm audit, secret isolation, API error leakage, CORS, prompt injection audit, localStorage PHI disclaimer)
- [x] Update `SECURITY.md` with dated audit findings and synthetic data disclaimer
- [x] Edge-case and resilience testing (`src/__tests__/resilienceAndEdgeCases.test.tsx`, duplicate Rx alerts, uncurated drug handling, FHIR null safety, offline fallbacks)
- [x] Spanish-language transcript input support end-to-end (UI chrome localized, Gemini prompt updated for English SOAP generation with verbatim quotes, offline non-English warning banner, and Spanish test scenario)
- [x] Multi-language clinical pipeline test suite (`src/__tests__/multiLanguagePipeline.test.tsx`)
- [x] Prompt-injection remediation (delimit `patientInfo` and `transcript` with `<patient_demographics>` and `<clinical_transcript>` boundary tags in `server.ts` and enforce data-isolation system instruction)

---

## Phase 1 (SIH 2026): Foundation, ClinicalCase, SQLite & Security Skeleton (Completed)
- [x] Shared TypeScript domain model: `ClinicalCase` and `ClinicalFact` provenance types (`src/types/clinicalCase.ts`) with sources: `PATIENT_REPORTED`, `CLINICIAN_OBSERVED`, `DOCUMENT_EXTRACTED`, `AI_GENERATED`, `CLINICIAN_VERIFIED`
- [x] Minimal server-side persistence with SQLite (`better-sqlite3`, WAL mode, foreign keys, 9 Tier 1 tables in `server/db/schema.sql` and `server/db/database.ts`)
- [x] Section 39 dependency justification documented for `better-sqlite3` (embedded, synchronous, 100% offline, zero client bundle impact)
- [x] Security skeleton with namespace separation (`/api/kiosk/*` and `/api/clinician/*`) in `server/security/auth.ts`
- [x] Session-scoped kiosk tokens (`kiosk_<hex>`) with automatic 30-min TTL and server-side reset/wipe
- [x] RBAC enforcement: Kiosk tokens strictly rejected on clinician routes with 403 Forbidden
- [x] Clinician authentication (`POST /api/clinician/login`) with 8-hour sessions
- [x] Minimal audit events recorded in SQLite (`SESSION_CREATED`, `SESSION_RESET`, `CONSENT_RECORDED`, `CASE_SUBMITTED`, `CLINICIAN_APPROVAL`, `FHIR_EXPORT`)
- [x] API contract documentation in `docs/API_SPEC.md`
- [x] Client API service module in `src/services/api.ts`
- [x] Automated test suite in `src/__tests__/phase1SecurityAndFoundation.test.ts` (9/9 tests passing; all 55/55 test suite passing)
- [x] Phase 1 Review & Hardening completed: removed hardcoded credentials, reverted UI badge, isolated test DB to in-memory, tested full reset semantics (delete unsubmitted, preserve submitted, 401 on reuse), logged RSK-11 in Risk Register.

---

## Phase 1.5: Chest Pain Vertical Slice (Completed)
- [x] Synthetic prescription fixture (`fixtures/prescriptions/synthetic_prescription_chest_pain.json` and `.svg`)
- [x] Kiosk red-flag evaluation on intake (`RF-CARD-001`, `EMERGENCY` priority)
- [x] Clinician endpoints: `POST /api/clinician/cases/:id/generate-soap`, `POST /api/clinician/cases/:id/approve`, `GET /api/clinician/cases/:id/fhir`
- [x] FHIR R4 Bundle generator extended for `ClinicalCase` (`src/utils/fhirConverter.ts`)
- [x] Offline local engine updated for acute coronary syndrome recognition
- [x] End-to-end integration test (`src/__tests__/phase1_5VerticalSlice.test.ts`) passing all 11 steps

---

## Phase 2: Patient Kiosk Shell & Multilingual Foundation (Completed)
- [x] Multi-language support (English, Hindi, Marathi, Spanish) in `src/i18n/locales/`
- [x] Translation status ledger (`docs/TRANSLATION_STATUS.md`) flagging hi and mr as NEEDS NATIVE-SPEAKER REVIEW
- [x] Mock ABHA verification adapter (`POST /api/kiosk/abha/verify`) with synthetic profile and demo disclaimer
- [x] Granular consent recording with 5 distinct permission scopes (history, voice, docs, cloud AI, FHIR)
- [x] Local-only privacy flag and Cloud AI gating check (`POST /api/kiosk/ai-gate-check`)
- [x] Visible Cloud-AI status indicator in kiosk UI header
- [x] 10 initial complaint templates catalog (`src/data/complaintsCatalog.ts` and `GET /api/kiosk/complaints`)
- [x] Touch-first patient kiosk component (`src/components/kiosk/PatientKiosk.tsx`) with >= 48px touch targets
- [x] Inactivity guardrail timer (3-min threshold with warning modal and auto-wipe)
- [x] Automated test suite in `src/__tests__/phase2KioskShell.test.ts` (12/12 passing; all 68/68 passing)

---

## Phase 3: Deterministic Clinical Question Engine & Intake Graph (Completed)
- [x] Config-driven question graph templates for 10 complaints (`src/data/interviewTemplates.ts`)
- [x] Deterministic question engine with branching and required fields (`src/utils/interviewEngine.ts`)
- [x] Dual confirmation policy (HIGH-RISK individual confirmation vs LOW-RISK batch summary confirmation)
- [x] Explicit "Not documented" handling for non-mandatory skipped slots
- [x] Indic language number normalization (Devanagari numerals ०-९ to 0-9)
- [x] Clinical specification document for MBBS review (`docs/CLINICAL_SPEC.md` marked PENDING MBBS REVIEW)
- [x] Automated test suite in `src/__tests__/phase3InterviewEngine.test.ts` (9/9 passing; all 77/77 passing)

---

## Phase 4: ASR Adapters, TTS & Marathi ASR Gate Harness (Completed)
- [x] Bhashini ASR adapter (`src/services/asr/asrAdapters.ts`) with credentials checking and labeled mock fallback
- [x] Local Whisper feasibility assessment (feasibility rejected for browser runtime, marked NOT RUN)
- [x] Web Speech API adapter with graceful headless fallback
- [x] Failsafe manual input fallback adapter
- [x] Browser Text-to-Speech (TTS) service with Indic voice support
- [x] Levenshtein-based WER and CER evaluation harness (`scripts/scoreAsr.ts`)
- [x] Marathi ASR gate fixture manifest (`fixtures/audio/marathi_eval/manifest.json`)
- [x] Marathi ASR decision gate document (`docs/audit/ASR_GATE.md` marked NOT RUN pending user audio)
- [x] Automated test suite in `src/__tests__/phase4AsrAdapters.test.ts` (10/10 passing; all 87/87 passing)

---

## Phase 5: Deterministic Versioned Red-Flag Rules & Triage Engine (Completed)
- [x] Versioned red-flag ruleset (`src/data/redFlagRules.ts`) with 12 rules across all 10 complaints
- [x] Enforced ruleVersion strictly present on every emitted alert
- [x] Non-diagnostic safe triage wording across all rules
- [x] Triage queue prioritization (Priority 1 STAT / EMERGENCY, Priority 2 URGENT, Priority 3 WARNING, Priority 4 NORMAL)
- [x] Deterministic red-flag evaluation engine (`src/utils/redFlagEngine.ts`)
- [x] Documented all 12 rules in `docs/CLINICAL_SPEC.md` marked PENDING CLINICIAN REVIEW
- [x] Automated test suite in `src/__tests__/phase5RedFlagRules.test.ts` (15/15 passing positive, negative, and boundary tests; all 102/102 passing)








---

## Phase 6: Medical Document Upload, Layered OCR Adapters & Timeline (Completed)
- [x] Document upload validation (MIME types, 10MB limit, 200x200 min resolution)
- [x] Document classification (Prescription, Lab Report, Discharge Summary, Unknown)
- [x] Layered OCR architecture (Gemini Vision with consent gate, Local OCR fallback, Manual entry)
- [x] Deterministic abnormal lab value evaluator (Blood sugar, Hemoglobin, Creatinine, Platelet count)
- [x] Synthetic OCR evaluation fixtures (ixtures/documents/eval/eval_fixtures.json)
- [x] Automated precision/recall scoring harness (scripts/scoreOcr.ts)
- [x] OCR evaluation report (docs/audit/OCR_EVAL.md with physical scans marked NOT RUN)
- [x] Automated test suite in src/__tests__/phase6OcrAndDocuments.test.ts (14/14 passing; all 116/116 passing)

---

## Phase 7: AYUSH Thin Slice (Prakriti & Agni Assessment) (Completed)
- [x] Config-driven Prakriti and Agni questions (src/data/ayush/prakritiAgniRules.ts) with classical references
- [x] Visible  PENDING BAMS REVIEW labels and disclaimer across all questions and screens
- [x] Deterministic tally scoring engine with dosha dominance and Agni type calculation
- [x] Structured ClinicalFact provenance generation (PATIENT_REPORTED, 	ouch, patient_confirmed, unverified by clinician)
- [x] Touch-first AYUSH intake component (src/components/kiosk/AyushIntake.tsx)
- [x] Kiosk API endpoints (GET /api/kiosk/ayush/questions, POST /api/kiosk/ayush/evaluate, POST /api/kiosk/ayush/save)
- [x] Formal BAMS reviewer review packet (docs/AYUSH_REVIEW_PACKET.md)
- [x] Automated test suite in src/__tests__/phase7AyushSlice.test.ts (15/15 passing; all 131/131 passing)

---

## Phase 8: Clinician Console, Priority Queue & Preloaded Consultation Workflow (Completed)
- [x] Priority queue triage sorting in GET /api/clinician/queue (Emergency Priority 1 > Urgent Priority 2 > Normal Priority 4)
- [x] Clinician console workstation component (src/components/clinician/ClinicianConsole.tsx)
- [x] Prominent red-flag banner displaying rule IDs, versions, and safe triage directives
- [x] Patient-ready summary card with visual clinical provenance badges (PATIENT_REPORTED, DOCUMENT_EXTRACTED)
- [x] Preloaded consultation workflow into existing doctor workspace (src/App.tsx)
- [x] Preservation of original direct doctor-only flow without kiosk dependency
- [x] Navigation toggle in Header (src/components/Header.tsx)
- [x] Automated test suite in src/__tests__/phase8ClinicianConsole.test.ts (5/5 passing; all 136/136 passing)

---

## Phase 9: Unified SOAP Synthesis, Deterministic Safety Scope & Mock ABDM Adapter (Completed)
- [x] Unified SOAP generation from ClinicalCase facts, documents, and doctor transcript (server/routes/clinicianRoutes.ts)
- [x] Deterministic safety engine with mandatory 9-rule dataset scope disclosure and  no alert != proof of safety UI notice (src/components/SafetyAlertsPanel.tsx)
- [x] Extended FHIR R4 export with first-class Provenance resource (src/utils/fhirConverter.ts)
- [x] Mock ABDM adapter (server/services/abdm/mockAbdmAdapter.ts) with synthetic disclaimer and POST /api/clinician/cases/:id/abdm-push
- [x] Clinician approval gate storing original AI output, edited output, reviewer, and timestamp in SQLite
- [x] Automated test suite in `src/__tests__/phase9UnifiedSoapAndSafety.test.ts` (6/6 passing; all 142/142 passing)

---

## Phase 10: Documentation Confidence, ICD-10 Suggestions & Clinic Analytics (Completed)
- [x] Unified case documentation confidence score (0-100) and section breakdown (`src/utils/tier2Documentation.ts`)
- [x] Primary care ICD-10 code suggester with explicit CPT billing disablement
- [x] Clinician endpoints for confidence (`GET /api/clinician/cases/:id/confidence`) and ICD-10 (`GET /api/clinician/cases/:id/icd10-suggestions`)
- [x] Clinician immutable audit-log viewer endpoint (`GET /api/clinician/audit-logs`)
- [x] Aggregated clinic analytics endpoint (`GET /api/clinician/analytics`)
- [x] Automated test suite in `src/__tests__/phase10Tier2ConfidenceAndAnalytics.test.ts` (8/8 passing; all 150/150 passing)

