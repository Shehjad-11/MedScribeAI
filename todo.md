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



