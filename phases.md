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
