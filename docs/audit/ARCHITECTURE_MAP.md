# MedScribeAI — Repository Architecture Map (Phase 0 Audit)

**Inspection Date:** 2026-10-03  
**Auditor:** Lead Software & Healthcare Architect (Antigravity Agent)  
**Target Codebase:** MedScribeAI (`medscribe-lite`)  
**Specification Reference:** `docs/MASTER_PROMPT.md` (Sections 0, 1, 2, 38, 53)

---

## 1. Executive Architecture Overview

MedScribeAI currently exists as a single-origin, full-stack application built with Express.js (`server.ts`) and React 19 / Vite (`src/App.tsx`). The application functions primarily as a single-screen clinician workstation designed to transcribe consultations via the browser Web Speech API or process uploaded audio/text, send structured prompts to Google Gemini (`gemini-3.6-flash`), and render editable 4-quadrant SOAP notes with ICD-10/CPT billing suggestions and deterministic safety alerts.

---

## 2. Frontend Structure & Routing

### 2.1 File Organization & Component Tree
- **Entry Points:**
  - [`index.html`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/index.html#L1-L14): HTML shell with title `"MedScribe Lite — AI Clinical Assistant"` and mount root `<div id="root"></div>`.
  - [`src/main.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/main.tsx#L1-L11): Mounts `<App />` wrapped in `<LanguageProvider>`.
  - [`src/index.css`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/index.css#L1-L82): Configures Tailwind CSS v4 `@theme` tokens and `@layer components` utility classes (`.btn-primary`, `.btn-secondary`, `.badge-brand`, `.card-base`, `.modal-overlay`, etc.).

- **Core Views & Hierarchy:**
  - [`src/App.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/App.tsx#L23-L383): Top-level component controlling view switching and encounter state.
    - If `currentView === 'landing'` ([`src/App.tsx:197-199`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/App.tsx#L197-L199)): Renders [`src/components/LandingPage.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/components/LandingPage.tsx).
    - If `currentView === 'workstation'` ([`src/App.tsx:201-381`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/App.tsx#L201-L381)):
      - [`src/components/Header.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/components/Header.tsx#L1-L120): Top navigation bar with branding, encounter count, safety alert pill, offline mode toggle, and language switcher (`EN`/`ES`).
      - [`src/components/PatientForm.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/components/PatientForm.tsx#L1-L193): Collapsible form for `PatientInfo` demographics.
      - [`src/components/TranscriptInput.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/components/TranscriptInput.tsx#L1-L395): Consultation transcript text area, Web Speech API mic toggle, audio upload (up to 25MB), scenario pills, and "Generate SOAP Note" CTA.
      - [`src/components/SafetyAlertsPanel.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/components/SafetyAlertsPanel.tsx#L1-L142): Displays combined safety alerts (deterministic rules + LLM flags) and documentation metadata.
      - [`src/components/SOAPNoteView.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/components/SOAPNoteView.tsx#L1-L314): Tabbed SOAP container importing subcomponents from `src/components/soap-note/`:
        - `SOAPNoteHeader.tsx`: Action toolbar (Read Aloud, Copy EHR, Print Prescription, Export FHIR, Save Encounter).
        - `SOAPNoteTabs.tsx`: Tab switcher (`All`, `S`, `O`, `A`, `P`).
        - `SubjectiveSection.tsx`: Chief complaint, HPI, Current Meds, Allergies.
        - `ObjectiveSection.tsx`: Vital signs, Physical exam, Labs/imaging.
        - `AssessmentSection.tsx`: Primary diagnosis, Differentials, Clinical summary.
        - `PlanSection.tsx`: Prescription table with dosage/frequency/duration editing, tests ordered, education, follow-up.
        - `DocumentationConfidenceBadge.tsx`: Confidence score pill with tooltip breakdown.
      - [`src/components/BillingCodingPanel.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/components/BillingCodingPanel.tsx#L1-L125): Renders ICD-10 diagnostic codes and CPT evaluation & management codes.
      - **Modals (`AnimatePresence` controlled in [`src/App.tsx:343-380`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/App.tsx#L343-L380)):**
        - [`PrintPrescriptionModal.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/components/PrintPrescriptionModal.tsx)
        - [`FHIRExportModal.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/components/soap-note/FHIRExportModal.tsx)
        - [`EncounterHistoryModal.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/components/EncounterHistoryModal.tsx)
        - [`ClinicAnalyticsModal.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/components/ClinicAnalyticsModal.tsx)

### 2.2 Routing Implementation
- **Router Library:** None. `react-router-dom` is **NOT installed** in [`package.json:14-25`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/package.json#L14-L25).
- **Navigation Mechanism:** Local React component state in [`src/App.tsx:25`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/App.tsx#L25):
  ```typescript
  const [currentView, setCurrentView] = useState<'landing' | 'workstation'>('landing');
  ```
- **Kiosk vs. Doctor Route Separation:** **NONE EXISTS.** There is no `/kiosk` route, no `/doctor` route, no separate layout, and no route guard. The single workstation view combines patient entry and doctor documentation.

---

## 3. Backend Endpoints (`server.ts`)

The Express server runs on port 3000 (`0.0.0.0:3000`) and serves both the API and the Vite frontend middleware.

| Endpoint | HTTP Method | File & Line | Request Payload | Response Payload | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | [`server.ts:33-35`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/server.ts#L33-L35) | None | `{ status: 'ok', app: 'MedScribe Lite' }` | Liveness check |
| `/api/medscribe/generate` | `POST` | [`server.ts:38-221`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/server.ts#L38-L221) | `{ patientInfo, transcript, audioBase64?, audioMimeType? }` | JSON conforming to `SOAPNote` | Generates SOAP note using Gemini 3.6 Flash |
| `/*` (wildcard) | `GET` | [`server.ts:233-235`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/server.ts#L233-L235) | None | `dist/index.html` (in production) | SPA fallback route |

---

## 4. Gemini AI Integration

- **SDK Package:** `@google/genai` v2.4.0 ([`package.json:15`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/package.json#L15), [`server.ts:4`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/server.ts#L4)).
- **Client Initialization:** Lazy singleton pattern in [`server.ts:13-30`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/server.ts#L13-L30) reading `process.env.GEMINI_API_KEY`.
- **Target Model:** `gemini-3.6-flash` ([`server.ts:193`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/server.ts#L193)).
- **Configuration:**
  - `temperature: 0.1` ([`server.ts:198`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/server.ts#L198)) for factual extraction precision.
  - `responseMimeType: 'application/json'` ([`server.ts:197`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/server.ts#L197)).
  - Clean-up logic for markdown fences: [`server.ts:204-210`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/server.ts#L204-L210).
- **Audio Multimodality:** Audio files up to 25MB sent as Base64 inline data (`mimeType: audioMimeType || 'audio/webm'`) to Gemini model (`contents.push({ inlineData: ... })`) in [`server.ts:178-187`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/server.ts#L178-L187).
- **Prompt Injection Defense:** Delimiter tags `<patient_demographics>` and `<clinical_transcript>` enforced in [`server.ts:71-74, 162-174`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/server.ts#L71-L74).

---

## 5. SOAP Schema (`src/types.ts`)

The schema is defined in [`src/types.ts:1-120`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/types.ts#L1-L120):
1. `PatientInfo` ([`L1-12`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/types.ts#L1-L12)): `id?`, `name`, `age`, `sex?`, `gender?`, `medicalHistory?`, `currentMedications?`, `knownAllergies?`, `encounterType?`, `clinicLocation?`.
2. `Prescription` ([`L14-20`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/types.ts#L14-L20)): `medication`, `dosage`, `frequency`, `instructions`, `duration?`.
3. `Subjective` ([`L22-28`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/types.ts#L22-L28)): `chief_complaint`, `history_of_present_illness`, `review_of_systems?`, `current_medications: string[]`, `allergies: string[]`.
4. `Objective` ([`L30-34`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/types.ts#L30-L34)): `vital_signs`, `physical_exam`, `labs_and_imaging`.
5. `Assessment` ([`L36-40`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/types.ts#L36-L40)): `primary_diagnosis`, `differential_diagnoses: string[]`, `clinical_summary`.
6. `Plan` ([`L42-47`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/types.ts#L42-L47)): `prescriptions: Prescription[]`, `diagnostic_tests_ordered: string[]`, `patient_education`, `follow_up`.
7. `BillingSuggestions` ([`L61-64`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/types.ts#L61-L64)): `icd_10_codes: ICD10Code[]`, `cpt_codes: CPTCode[]`.
8. `SafetyAlert` ([`L66-70`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/types.ts#L66-L70)): `type`, `severity: 'High' | 'Medium' | 'Low'`, `message`.
9. `MetaInfo` ([`L72-75`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/types.ts#L72-L75)): `uncertainty_flagged: boolean`, `time_saved_estimate_minutes: number`.
10. `DocumentationConfidence` ([`L83-89`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/types.ts#L83-L89)): `overall_score`, `subjective`, `objective`, `assessment`, `plan` (each has `score`, `reasoning`, `missing_information?`).
11. `SOAPNote` ([`L91-100`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/types.ts#L91-L100)): Combines Subjective, Objective, Assessment, Plan, BillingSuggestions, SafetyAlerts, MetaInfo, DocumentationConfidence.
12. `EncounterRecord` ([`L102-110`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/types.ts#L102-L110)): Represents historical encounter stored in `localStorage`.

*Note on Missing Domain Objects:* The repository completely lacks `ClinicalCase`, `ProvenanceRecord`, `PatientConsent`, `ComplaintGraph`, `DocumentExtraction`, or `AYUSHAssessment`.

---

## 6. Safety Engine & Drug Interaction Logic

### 6.1 Database Definition (`src/data/drugInteractions.ts`)
- File: [`src/data/drugInteractions.ts:1-104`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/data/drugInteractions.ts#L1-L104)
- **Total Rules:** **EXACTLY 9 interaction rules** ([`L12-103`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/data/drugInteractions.ts#L12-L103)):
  1. `nsaid-antihypertensive` (High severity, drug-drug)
  2. `nsaid-ckd` (High severity, drug-condition)
  3. `metformin-ckd` (High severity, drug-condition)
  4. `ace-arb-potassium` (High severity, drug-drug)
  5. `artemether-qt` (Medium severity, drug-drug)
  6. `amoxicillin-allopurinol` (Medium severity, drug-drug)
  7. `warfarin-nsaid` (High severity, drug-drug)
  8. `ciprofloxacin-antacid` (Medium severity, drug-drug)
  9. `paracetamol-curated` (Medium severity, drug-condition)
- **Active Ingredients Covered:** ~18 distinct pharmacological agents.

### 6.2 Deterministic Verification Logic (`src/utils/drugInteractionChecker.ts`)
- File: [`src/utils/drugInteractionChecker.ts:8-118`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/utils/drugInteractionChecker.ts#L8-L118)
- Performs four deterministic checks:
  1. **Allergy Contraindications** ([`L18-32`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/utils/drugInteractionChecker.ts#L18-L32)): Substring match on allergy string or hardcoded rule for `amoxicillin` + `penicillin`.
  2. **Duplicate Prescription Detection** ([`L34-50`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/utils/drugInteractionChecker.ts#L34-L50)): Flags identical medication names in prescription array.
  3. **Regex Interaction Matching** ([`L52-97`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/utils/drugInteractionChecker.ts#L52-L97)): Evaluates `drugA` regex against prescribed meds and `drugB` against prescribed meds or combined history string.
  4. **Unchecked Medication Guardrail** ([`L99-115`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/utils/drugInteractionChecker.ts#L99-L115)): If a prescribed drug does not match any pattern in `DRUG_INTERACTION_DATABASE`, it returns a `'Missing Info'` alert explicitly stating that the drug was not present in the curated local database and was not checked.
- **Client Pipeline Merging:** In [`src/App.tsx:280-294`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/App.tsx#L280-L294), the client calls `checkDrugInteractions(...)` on the generated plan and deduplicates alerts with Gemini's returned `safety_alerts`.

---

## 7. ICD-10 & CPT Billing Logic

- **Generation:**
  - In cloud mode, Gemini is instructed to suggest ICD-10 and CPT codes with rationales in [`server.ts:110-125`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/server.ts#L110-L125).
  - In offline mode, `generateOfflineSOAPNote` maps hardcoded ICD-10 codes based on substring matching (`B50.9` for malaria, `I10` for hypertension, `H66.001` for otitis media, `A09` for gastroenteritis, `R50.9` for fever) and sets static CPT `99213` in [`src/utils/offlineLocalEngine.ts:67-113`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/utils/offlineLocalEngine.ts#L67-L113).
- **Presentation:** Rendered in [`src/components/BillingCodingPanel.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/components/BillingCodingPanel.tsx) with a "Copy Codes" button.
- **Scope Note per Master Prompt Section 1:** CPT is US-centric and is NOT an SIH requirement. It exists in the code and must be preserved where safe, but isolated from the SIH MVP story.

---

## 8. FHIR Module

- **Converter File:** [`src/utils/fhirConverter.ts:23-280`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/utils/fhirConverter.ts#L23-L280)
- **Standard:** HL7 FHIR Release 4 (R4) JSON Bundle (`type: 'collection'`).
- **Generated Resources:**
  1. `Patient` ([`L35-55`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/utils/fhirConverter.ts#L35-L55)): Name, gender, age extension.
  2. `Encounter` ([`L58-86`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/utils/fhirConverter.ts#L58-L86)): Status, class (`VR` or `AMB`), subject, period, clinic location.
  3. `Condition` ([`L88-163`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/utils/fhirConverter.ts#L88-L163)): One resource per ICD-10 code with system `http://hl7.org/fhir/sid/icd-10` or fallback text from primary diagnosis.
  4. `MedicationRequest` ([`L166-198`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/utils/fhirConverter.ts#L166-L198)): One resource per prescription with dosage instructions and medication concept.
  5. `Composition` ([`L201-271`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/utils/fhirConverter.ts#L201-L271)): LOINC 11506-3 ("Progress Note") containing 4 sections with LOINC section codes: Subjective (`61150-0`), Objective (`61149-2`), Assessment (`51848-0`), Plan (`18776-5`).
- **UI Export:** Modal [`src/components/soap-note/FHIRExportModal.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/components/soap-note/FHIRExportModal.tsx) allows copying formatted JSON or downloading `fhir-encounter-bundle.json`.
- **ABDM/HIE Linkage:** None. There is no external ABDM M1/M2/M3 milestone bridge or server dispatch.

---

## 9. Offline Local Engine

- **Implementation:** [`src/utils/offlineLocalEngine.ts:10-191`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/utils/offlineLocalEngine.ts#L10-L191)
- **Nature of Implementation:** Purely deterministic keyword and regular expression matching running in the client browser thread.
- **Trigger Conditions:**
  1. Clinician explicitly toggles "Offline Mode" switch in Header ([`src/App.tsx:107-118`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/App.tsx#L107-L118)).
  2. Automatic error fallback when `/api/medscribe/generate` fails with network timeout, 500 error, or offline status ([`src/App.tsx:149-154`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/App.tsx#L149-L154)).
- **Limitations:**
  - Not an on-device ML model (e.g. no ONNX, WebLLM, or Transformers.js).
  - Fabricates vitals, exams, and prescriptions based on keyword triggers (`malaria`, `hypertension`, `ear`, `diarrhea`, `fever`).
  - Flags non-English (specifically Spanish) transcripts with a high-severity limitation warning ([`src/utils/offlineLocalEngine.ts:123-129`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/utils/offlineLocalEngine.ts#L123-L129)). Zero Marathi/Hindi fallback logic exists.

---

## 10. Storage & Persistence

- **Server-Side Persistence:** **ZERO.** No SQLite, PostgreSQL, MongoDB, or filesystem persistence exists in `server.ts`.
- **Client-Side Persistence:** Exclusively browser `localStorage`:
  1. `medscribe_lite_encounters_v1`: Defined in [`src/App.tsx:21`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/App.tsx#L21). Stores JSON array of `EncounterRecord` objects. Synchronized via React `useEffect` in [`src/App.tsx:64-70`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/App.tsx#L64-L70).
  2. `medscribe_lite_language_v1`: Defined in [`src/i18n/LanguageContext.tsx:18`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/i18n/LanguageContext.tsx#L18). Stores selected language string (`'en'` or `'es'`).
- **`sessionStorage` Usage:** **ZERO.** The string `sessionStorage` does not appear anywhere in `src/`.
- **Security Implication:** Any user with access to the browser origin can inspect, read, or clear all saved clinical encounter records.

---

## 11. Authentication & Authorization Boundaries

- **State:** **NONE EXISTS.**
- **Details:**
  - No user registration, login screen, session cookie, JWT, or Bearer token check.
  - Express routes [`/api/health`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/server.ts#L33) and [`/api/medscribe/generate`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/server.ts#L38) are completely public and unauthenticated.
  - No role separation between Patient, Receptionist/Kiosk, and Doctor.

---

## 12. Automated Test Suite & CI

- **Runner:** Vitest v4.1.10 (`npm run test` executes `vitest run`) with `happy-dom` environment.
- **Type Checking:** `npm run lint` executes `tsc --noEmit`.
- **CI Pipeline:** [`.github/workflows/ci.yml:1-36`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/.github/workflows/ci.yml#L1-L36) runs on push/PR to `main`: runs `npm ci`, `npm run lint`, `npm test`, and `npm run build`.
- **Current Verified Results (2026-10-03):**
  - `tsc --noEmit`: Exit code 0 (0 errors).
  - `vitest run`: **7 test files, 46 tests passed (100% passing)**:
    1. [`src/__tests__/fhirConverter.test.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/__tests__/fhirConverter.test.tsx) (6 tests)
    2. [`src/__tests__/drugInteractions.test.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/__tests__/drugInteractions.test.tsx) (5 tests)
    3. [`src/__tests__/offlineLocalEngine.test.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/__tests__/offlineLocalEngine.test.tsx) (5 tests)
    4. [`src/__tests__/documentationConfidence.test.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/__tests__/documentationConfidence.test.tsx) (2 tests)
    5. [`src/__tests__/multiLanguagePipeline.test.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/__tests__/multiLanguagePipeline.test.tsx) (5 tests)
    6. [`src/__tests__/components.test.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/__tests__/components.test.tsx) (10 tests)
    7. [`src/__tests__/resilienceAndEdgeCases.test.tsx`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/__tests__/resilienceAndEdgeCases.test.tsx) (13 tests)

---

## 13. Run & Deploy Commands

From [`package.json:6-13`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/package.json#L6-L13):
- Development: `npm run dev` → `tsx server.ts` (runs server with embedded Vite dev middleware).
- Build: `npm run build` → `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`.
- Production Start: `npm start` → `node dist/server.cjs`.
- Typecheck: `npm run lint` → `tsc --noEmit`.
- Test: `npm test` → `vitest run`.
- Clean: `npm run clean` → `rm -rf dist server.js`.

---

## 14. Dependencies Inventory (`package.json`)

### Production Dependencies (`dependencies`):
- `@google/genai` (^2.4.0): Official Google Gen AI SDK.
- `@tailwindcss/vite` (^4.1.14): Tailwind v4 Vite plugin.
- `@vitejs/plugin-react` (^5.0.4): React Vite plugin.
- `dotenv` (^17.2.3): Environment variable loader.
- `express` (^4.21.2): HTTP web framework.
- `lucide-react` (^0.546.0): UI icon set.
- `motion` (^12.23.24): Framer motion animation library.
- `react` (^19.0.1): React framework.
- `react-dom` (^19.0.1): React DOM renderer.
- `vite` (^6.2.3): Vite development server and bundler.

### Development Dependencies (`devDependencies`):
- `@testing-library/jest-dom` (^7.0.0), `@testing-library/react` (^16.3.2)
- `@types/express` (^4.17.21), `@types/node` (^22.14.0)
- `autoprefixer` (^10.4.21), `tailwindcss` (^4.1.14)
- `esbuild` (^0.25.0), `tsx` (^4.21.0), `typescript` (~5.8.2)
- `happy-dom` (^20.11.1), `jsdom` (^30.0.0), `vitest` (^4.1.10)
