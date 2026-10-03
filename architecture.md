# Architecture & Data Blueprint (architecture.md)

---

## 1. Actual Repository Structure

```
medscribe-lite/
├── .env
├── .env.example
├── .gitignore
├── README.md
├── index.html                           (Line count: 14)
├── metadata.json                        (Line count: 7)
├── package-lock.json
├── package.json                         (Line count: 36)
├── server.ts                            (Line count: 210)
├── tsconfig.json                        (Line count: 27)
├── vite.config.ts                       (Line count: 23)
├── assets/
└── src/
    ├── App.tsx                          (Line count: 312)
    ├── index.css                        (Line count: 2)
    ├── main.tsx                         (Line count: 11)
    ├── types.ts                         (Line count: 103)
    ├── components/
    │   ├── BillingCodingPanel.tsx       (Line count: 125)
    │   ├── ClinicAnalyticsModal.tsx     (Line count: 134)
    │   ├── EncounterHistoryModal.tsx    (Line count: 145)
    │   ├── Header.tsx                   (Line count: 92)
    │   ├── PatientForm.tsx              (Line count: 190)
    │   ├── PrintPrescriptionModal.tsx   (Line count: 143)
    │   ├── SOAPNoteView.tsx             (Line count: 772)
    │   ├── SafetyAlertsPanel.tsx        (Line count: 137)
    │   └── TranscriptInput.tsx          (Line count: 328)
    └── data/
        └── sampleScenarios.ts           (Line count: 150)
```

---

## 2. End-to-End Data Flow

The application follows a client-server architecture with an Express middleware backend and a Vite React frontend:

1. **User Input / Dictation (Browser):**
   - User inputs demographic context in `PatientForm.tsx` (`PatientInfo`).
   - User enters, dictates via Web Speech API, or uploads an audio file in `TranscriptInput.tsx`.

2. **API Request Dispatch (`App.tsx`):**
   - `handleGenerateSOAP` issues a `POST /api/medscribe/generate` fetch request containing `{ patientInfo, transcript, audioBase64, audioMimeType }`.

3. **Backend Middleware Processing (`server.ts`):**
   - Express server parses request payload (with 50MB limit for audio).
   - `getGeminiClient()` lazy-initializes `@google/genai` with `process.env.GEMINI_API_KEY`.
   - Constructs strict clinical system instructions enforcing fact extraction, hallucination prevention, and structured JSON output.
   - Calls `ai.models.generateContent` targeting model `gemini-3.6-flash`.

4. **Structured JSON Parsing (`server.ts` → `App.tsx`):**
   - Server sanitizes raw text response, strips markdown code blocks if present, parses JSON conforming to `SOAPNote` interface, and returns it to the client.

5. **UI Rendering & Panel Distribution (`App.tsx`):**
   - `SOAPNoteView.tsx` renders Subjective, Objective, Assessment, and Plan (Prescriptions) sections with full editing and speech synthesis capabilities.
   - `SafetyAlertsPanel.tsx` renders clinical interaction alerts, uncertainty flags, and estimated time saved.
   - `BillingCodingPanel.tsx` renders suggested ICD-10 and CPT Evaluation & Management codes.
   - Encounters are persisted to `localStorage` (`medscribe_lite_encounters_v1`) and viewable via `EncounterHistoryModal.tsx` and `ClinicAnalyticsModal.tsx`.

---

## 3. Known Technical Debt

1. **Monolithic Component File:**
   - `src/components/SOAPNoteView.tsx` spans **772 lines** of code. It handles state, tab filtering, text-to-speech, EHR text generation, prescription table editing, and rendering for all four SOAP sections. Needs refactoring into smaller sub-components (`SubjectiveSection`, `ObjectiveSection`, `AssessmentSection`, `PlanSection`, `PrescriptionTable`).

2. **Minimal Styling Token Layer:**
   - `src/index.css` contains only **2 lines** (`@import "tailwindcss";`). Design tokens, custom animations, font imports, and print utility stylesheets are unorganized and inline across components.

3. **Absence of Test Suite:**
   - There are **0 test files** (`.test.ts`, `.spec.tsx`) anywhere in the repository. Neither unit testing (Vitest/Jest) nor end-to-end testing is currently configured.
