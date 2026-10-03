# Project Execution Phases (phases.md)

---

## Phase 0: Governance Setup
- **Scope:** Initial codebase analysis and creation of 11 root governance files (`system-instructions.md`, `todo.md`, `architecture.md`, `ui-dna.md`, `dependency-lockbase.md`, `project-context.md`, `prd.md`, `rules.md`, `phases.md`, `design.md`, `memory.md`).
- **Exit Criteria:** All 11 root governance markdown files are created with accurate repository citations and Phase 0 completion logged in `memory.md`.

---

## Phase 1: Startup-Polish & De-Hackathon-ify
- **Scope:**
  - Rename `package.json` project name from `react-example` to `medscribe-lite`.
  - Rewrite `index.html` page title from `My Google AI Studio App` to `MedScribe Lite — AI Clinical Assistant`.
  - Remove exposed model-version badge (`Gemini 3.6 Engine`) and stray `Bento AI` tag from `src/components/Header.tsx`.
  - Rewrite `README.md` to professional startup-grade standard.
  - Add repository root compliance files (`LICENSE`, `SECURITY.md`, `CHANGELOG.md`).
  - Document all `.env` variables in `.env.example`.
  - Enhance UI error states, empty states, and loading indicators across all views.
- **Exit Criteria:** The project repository contains no generic AI Studio boilerplate metadata, exposed internal raw tags, or undocumented environment variables, and passes human UI review.

---

## Phase 2: Code Quality & Architecture Refactoring
- **Scope:**
  - Refactor `src/components/SOAPNoteView.tsx` (772 lines) into smaller modular components (`SubjectiveSection`, `ObjectiveSection`, `AssessmentSection`, `PlanSection`, `PrescriptionTable`).
  - Implement a clean design token layer for `src/index.css` replacing the basic 2-line Tailwind import.
  - Add automated component and API unit tests using Vitest/Jest.
  - Configure GitHub Actions CI workflow to run type-checking (`npm run lint`) and tests on push.
- **Exit Criteria:** `SOAPNoteView.tsx` line count is reduced under 200 lines, custom CSS tokens are established, and `npm run test` & `npm run lint` pass cleanly with automated CI checks.

---

## Phase 3: Positioning & Public Landing Page
- **Scope:**
  - Design and build a public-facing product landing page showcasing hero value proposition, primary care workflow diagram, interactive demo preview, pricing tiers, and call-to-action (CTA).
  - Produce high-impact demo assets, workflow graphics, and UI screenshots for clinical stakeholders.
- **Exit Criteria:** Prospective clinical users can navigate the landing page, understand the product's primary care value proposition, and access the documentation workstation seamlessly.

---

## Phase 4: Feature Backlog & Enterprise Integration
- **Scope:**
  - Multi-language consultation input and automated translation support (e.g., Spanish, French, Swahili, Hindi).
  - Standardized FHIR JSON export for interoperability with hospital electronic health record systems (EHR).
  - Integration of real-time drug-drug interaction database lookup API.
  - Granular AI confidence scoring per SOAP section and section-level uncertainty flags.
- **Exit Criteria:** Clinicians can input multi-language consultations and export valid FHIR R4 JSON resources directly from the SOAP Note workspace.

---

## Phase 5: Hardening
- **Scope:**
  - Security review: Audit `npm audit` vulnerabilities, secret leakage risk, API error responses, CORS restriction, prompt injection vulnerabilities, and client storage handling.
  - Edge-case and resilience testing: Ensure robust error boundaries, graceful API failure handling, and input edge case validation across all async workflows.
  - Internationalization: Support multi-language end-to-end processing starting with Spanish-language transcript inputs.
- **Exit Criteria:** Zero committed secrets, `npm audit` clean of high/critical vulnerabilities, error boundaries on every async flow, and at least Spanish-language transcript input supported end-to-end.

---

## Phase 1 (SIH 2026 Redevelopment): Foundation & Security Skeleton
- **Scope:**
  - Build central `ClinicalCase` TypeScript schema with 5 provenance sources (`PATIENT_REPORTED`, `CLINICIAN_OBSERVED`, `DOCUMENT_EXTRACTED`, `AI_GENERATED`, `CLINICIAN_VERIFIED`).
  - Implement Tier 1 server-side SQLite persistence (`server/db/schema.sql` and `server/db/database.ts` with 9 tables).
  - Enforce Security Skeleton with namespace isolation: `/api/kiosk/*` and `/api/clinician/*`.
  - Session-scoped kiosk tokens with 30-min expiry, server-side reset/wipe, and cross-patient isolation.
  - Strict RBAC: Kiosk tokens rejected with 403 Forbidden on all clinician endpoints.
  - Minimal audit event logging for consent, sessions, submission, approval, and FHIR export.
  - Document complete API contracts in `docs/API_SPEC.md`.
- **Exit Criteria:**
  - All 46 existing Vitest tests continue to pass without regression.
  - Security integration test suite passes 100% proving kiosk isolation, 403 rejection, and unauthenticated rejection.
  - Clean TypeScript compilation (`tsc --noEmit`).

---

## Phase 1.5: Chest Pain Vertical Slice
- **Scope:**
  - Synthesize synthetic prescription fixture for chest pain patient with OCR extraction mockup.
  - Wire kiosk intake through red-flag evaluation (`RF-CARD-001`), clinical case creation, doctor summary, existing SOAP synthesis, deterministic safety checking, clinician approval gate, FHIR export, and kiosk session wipe.
  - Automated end-to-end integration test validating the entire cross-role pipeline.
- **Exit Criteria:**
  - Full end-to-end integration test passes (`phase1_5VerticalSlice.test.ts`).
  - Total test count passes with zero regressions.
  - Clean TypeScript compilation (`tsc --noEmit`).

---

## Phase 2: Patient Kiosk Shell & Multilingual Foundation
- **Scope:**
  - Implement 4-language support (English, Hindi, Marathi, Spanish) with `docs/TRANSLATION_STATUS.md` ledgering Hindi/Marathi as `NEEDS NATIVE-SPEAKER REVIEW`.
  - Build mock ABHA identification adapter (`POST /api/kiosk/abha/verify`) with synthetic profile and demo disclaimer.
  - Implement granular 5-scope consent with local-only mode flag and server-side cloud AI gate check (`POST /api/kiosk/ai-gate-check`).
  - Configure catalog of 10 initial complaints with multilingual titles and risk categories (`src/data/complaintsCatalog.ts`).
  - Build touch-first kiosk interface (`src/components/kiosk/PatientKiosk.tsx`) with >= 48px touch targets and 3-minute inactivity session wipe.
- **Exit Criteria:**
  - Kiosk shell integration test suite passes 100% (`phase2KioskShell.test.ts`).
  - Zero regressions across existing tests.
  - Clean TypeScript compilation (`tsc --noEmit`).

---

## Phase 3: Deterministic Clinical Question Engine & Intake Graph
- **Scope:**
  - Build config-driven question templates for all 10 complaints (`src/data/interviewTemplates.ts`) supporting 7 question types, branching, and risk categorization.
  - Implement deterministic dialogue engine (`src/utils/interviewEngine.ts`) with mandatory field enforcement and "Not documented" handling for skipped optional slots.
  - Implement dual confirmation policy: individual confirmation for high-risk symptoms, batch summary confirmation for low-risk facts.
  - Write clinical specification document (`docs/CLINICAL_SPEC.md`) listing all questions, types, and red-flag rules marked PENDING MBBS REVIEW.
- **Exit Criteria:**
  - Interview engine test suite passes 100% (`phase3InterviewEngine.test.ts`).
  - Total test count passes with zero regressions.
  - Clean TypeScript compilation (`tsc --noEmit`).

---

## Phase 4: ASR Adapters, TTS & Marathi ASR Gate Harness
- **Scope:**
  - Build layered ASR adapters (`src/services/asr/asrAdapters.ts`) for Bhashini (with labeled mock fallback), Local Whisper (feasibility evaluated and stated not feasible in browser/Node), Web Speech, and Manual touch/text.
  - Implement browser-based Text-to-Speech service for patient vocal prompts.
  - Create Marathi ASR gate scoring harness (`scripts/scoreAsr.ts`) measuring WER and CER.
  - Create audio fixture manifest (`fixtures/audio/marathi_eval/manifest.json`) and audit report (`docs/audit/ASR_GATE.md`) explicitly listing operator-supplied recordings and marked NOT RUN.
- **Exit Criteria:**
  - ASR adapters and scoring test suite passes 100% (`phase4AsrAdapters.test.ts`).
  - Zero regressions across existing tests.
  - Clean TypeScript compilation (`tsc --noEmit`).

---

## Phase 5: Deterministic Versioned Red-Flag Rules & Triage Engine
- **Scope:**
  - Develop 12 versioned, config-driven red-flag rules across all 10 complaints (`src/data/redFlagRules.ts`).
  - Enforce ruleVersion string strictly present on every generated alert.
  - Implement deterministic triage evaluation engine (`src/utils/redFlagEngine.ts`) calculating triage priority and sorting emergency alerts first.
  - Document all rules and safe wording in `docs/CLINICAL_SPEC.md` marked PENDING CLINICIAN REVIEW.
- **Exit Criteria:**
  - Red-flag unit and boundary test suite passes 100% (`phase5RedFlagRules.test.ts`).
  - Total test count passes with zero regressions.
  - Clean TypeScript compilation (`tsc --noEmit`).







---

## Phase 6: Medical Document Upload, Layered OCR Adapters & Timeline
- **Scope:**
  - Build pre-flight upload validator (src/services/ocr/ocrAdapters.ts) checking MIME types, 10MB file limit, and 200x200 resolution.
  - Implement deterministic document classifier and abnormal lab value evaluator for common metabolic/hematologic panels.
  - Implement layered OCR architecture with Gemini Vision (guarded by consent and local-only switch), Local OCR fallback, and manual clinical entry fallback.
  - Create synthetic evaluation fixtures and automated precision/recall scoring harness (scripts/scoreOcr.ts).
  - Document OCR accuracy report in docs/audit/OCR_EVAL.md marking real camera trials as NOT RUN.
- **Exit Criteria:**
  - Document & OCR test suite passes 100% (phase6OcrAndDocuments.test.ts).
  - Total test count passes with zero regressions.
  - Clean TypeScript compilation (	sc --noEmit).

---

## Phase 7: AYUSH Thin Slice (Prakriti & Agni Assessment)
- **Scope:**
  - Build config-driven assessment rules for 5 Prakriti and 3 Agni questions (src/data/ayush/prakritiAgniRules.ts).
  - Enforce mandatory PENDING BAMS REVIEW tags and disclaimers on every question, option, score, and screen.
  - Implement deterministic tally scoring logic and clinical provenance generator.
  - Author formal clinical review document for BAMS review (docs/AYUSH_REVIEW_PACKET.md).
  - Integrate touch-first intake module (src/components/kiosk/AyushIntake.tsx) and server endpoints.
- **Exit Criteria:**
  - AYUSH unit and integration test suite passes 100% (phase7AyushSlice.test.ts).
  - Total test count passes with zero regressions.
  - Clean TypeScript compilation (	sc --noEmit).

---

## Phase 8: Clinician Console, Priority Queue & Preloaded Consultation Workflow
- **Scope:**
  - Enhance GET /api/clinician/queue with deterministic priority queue sorting placing Priority 1 EMERGENCY cases at top.
  - Implement full Clinician Console (src/components/clinician/ClinicianConsole.tsx) with priority queue filtering, red-flag alert banners, and patient-ready summary cards.
  - Integrate provenance badges (PATIENT_REPORTED, DOCUMENT_EXTRACTED, etc.) throughout clinical fact cards.
  - Build preloading mechanism into the existing consultation workspace while strictly preserving direct doctor-only consultation flows.
- **Exit Criteria:**
  - Clinician console and priority queue test suite passes 100% (phase8ClinicianConsole.test.ts).
  - Total test count passes with zero regressions.
  - Clean TypeScript compilation (	sc --noEmit).

---

## Phase 9: Unified SOAP Synthesis, Deterministic Safety Scope & Mock ABDM Adapter
- **Scope:**
  - Synthesize unified SOAP notes from ClinicalCase intake facts, document prescriptions, and consultation transcript.
  - Implement mandatory UI disclosure on SafetyAlertsPanel: 9-rule curated dataset scope and  no alert != proof of safety banner.
  - Extend FHIR R4 mapping to include a first-class Provenance resource linking author and patient.
  - Build MockAbdmAdapter (server/services/abdm/mockAbdmAdapter.ts) supporting care context linking and health data push.
  - Upgrade clinician approval gate to store original AI output, edited output, reviewer, and timestamp in SQLite.
- **Exit Criteria:**
  - Unified SOAP, safety engine, FHIR Provenance, and ABDM push tests pass 100% (phase9UnifiedSoapAndSafety.test.ts).
  - Total test count passes with zero regressions.
  - Clean TypeScript compilation (`tsc --noEmit`).

---

## Phase 10: Documentation Confidence, ICD-10 Suggestions & Clinic Analytics (Completed)
- **Scope:**
  - Build `calculateCaseConfidence` scoring overall documentation completeness (0-100) across demographics, intake, interview, and triage/documents.
  - Implement rule-based primary care ICD-10 code suggestions with explicit CPT billing disablement.
  - Expose clinician endpoints for case confidence, ICD-10 suggestions, immutable audit log inspection, and aggregated clinic triage analytics.
- **Exit Criteria:**
  - Tier 2 confidence, ICD-10, and analytics integration tests pass 100% (`phase10Tier2ConfidenceAndAnalytics.test.ts`).
  - Total test count passes with zero regressions (150/150).
  - Clean TypeScript compilation (`tsc --noEmit`).

---

## Phase 11: Security Hardening, Encryption-at-Rest & Authorization Matrix (Completed)
- **Scope:**
  - Authenticated encryption at rest (AES-256-GCM) for uploaded patient documents and extracted clinical data (`server/security/encryption.ts`).
  - Upload security: MIME whitelist, 10MB limit, binary magic bytes verification, path sanitization, and temp-file cleanup (`server/security/fileUploadSecurity.ts`).
  - Sliding-window in-memory rate limiting on kiosk routes (`server/security/rateLimiter.ts`).
  - Hardened HTTP security headers (`nosniff`, `DENY`, CSP, `Referrer-Policy`, no `X-Powered-By`).
  - Comprehensive authorization test matrix: public, kiosk token, clinician token role segregation.
  - Authored `docs/SAFETY_AND_PRIVACY.md` detailing implemented vs planned controls and explicit non-compliance academic disclaimers.
- **Exit Criteria:**
  - Security hardening test suite passes 100% (`phase11SecurityHardening.test.ts`).
  - Total test count passes with zero regressions (166/166).
  - Clean TypeScript compilation (`tsc --noEmit`).

---

## Phase 12: Unified Evaluation Harness & System Verification Report (Completed)
- **Scope:**
  - Build and execute unified evaluation runner (`scripts/runEvaluation.ts`) evaluating all system subsystems.
  - Document OCR evaluation: 2 synthetic fixtures evaluated across 4 fields (100% precision/recall).
  - Document Marathi ASR gate status: 5 registered samples in manifest, marked `NOT RUN` pending physical operator recordings.
  - Document Red-Flag evaluation: 12 versioned rules across 15 test conditions (100% pass).
  - Document Safety Engine evaluation: 9 curated primary care rules with critical bleeding detection verified.
  - Document AYUSH evaluation: 8 classical questions evaluated and stamped `PENDING BAMS REVIEW`.
  - Author comprehensive formal report (`docs/EVALUATION_REPORT.md`) with explicit sample sizes and zero invented metrics.
- **Exit Criteria:**
  - Evaluation runner executes cleanly with zero runtime exceptions.
  - Total test count passes with zero regressions (166/166).
  - Clean TypeScript compilation (`tsc --noEmit`).

---

## Phase 13: Local Deployment, Windows Setup & Synthetic Demo Seeder (Completed)
- **Scope:**
  - One-command Windows setup scripts (`setup.bat` and `setup.ps1`).
  - Seeded synthetic demonstration dataset (`scripts/seedDemoData.ts`) populating 5 clinical cases (ACS Emergency, Dyspnea Emergency, Fever Urgent, Hemoptysis Urgent, AYUSH Normal).
  - SQLite online backup script (`scripts/backupDb.ts`) creating non-blocking snapshots in `backups/`.
  - Upgraded health check endpoint (`/api/health`) reporting database status, case counts, and uptime.
  - Authored deployment and recovery guides (`docs/KIOSK_LAUNCH_NOTES.md`, `docs/FAILURE_RECOVERY.md`, updated `README.md`).
- **Exit Criteria:**
  - Database seeder and backup scripts execute cleanly.
  - Health check responds with `sqlite: connected`.
  - Total test count passes with zero regressions (166/166).
  - Clean TypeScript compilation (`tsc --noEmit`).




