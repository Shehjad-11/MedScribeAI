# MedScribeAI — Comprehensive Risk Register (Phase 0 Audit)

**Inspection Date:** 2026-10-03  
**Auditor:** Lead Software & Healthcare Architect (Antigravity Agent)  
**Specification Reference:** `docs/MASTER_PROMPT.md` (Sections 0, 15, 29, 30, 38)

---

## 1. Risk Evaluation Matrix

| Risk ID | Category | Description & Impact | Current Repository Status | Severity | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | **Security / Isolation** | **Complete Absence of Patient Session Isolation:** Kiosk and Doctor UI share one origin and browser `localStorage`. Patient A data remains visible to Patient B. | Unmitigated (`src/App.tsx:54-70`). Encounters stored in single key `medscribe_lite_encounters_v1`. | **CRITICAL** | **HIGH** | Build Phase 1 Security Skeleton: session-scoped kiosk tokens (`Bearer kiosk-...`), separate API namespaces, server-side session expiry, and explicit kiosk UI wipe. |
| **RSK-02** | **Security / Auth** | **Zero Authentication on Backend API:** All routes (`/api/medscribe/generate`, `/api/health`) are completely unauthenticated. Anyone on the local network or tunnel can invoke LLM generation. | Unmitigated (`server.ts:33-221`). No middleware or headers checked. | **CRITICAL** | **HIGH** | Implement clinician authentication middleware; restrict `/api/clinician/*` to authenticated users; reject unauthenticated calls. |
| **RSK-03** | **Clinical Safety / Dataset Coverage** | **Extremely Narrow Drug-Interaction Dataset:** The repository contains **EXACTLY 9 interaction rules** covering only **~18 active ingredients**. Clinicians might assume comprehensive drug safety verification. | Verified: [`src/data/drugInteractions.ts:12-103`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/data/drugInteractions.ts#L12-L103) contains exactly 9 rules. | **HIGH** | **HIGH** | 1. Maintain prominent UI disclaimer: "Curated demonstration database — covers 9 critical primary care interaction rules."<br>2. Preserve existing `Unchecked Medication` alert (`drugInteractionChecker.ts:108-114`) for unlisted drugs.<br>3. NEVER claim comprehensive CDSS or "no interaction". |
| **RSK-04** | **ASR / Multilingual** | **Marathi ASR Unavailability / High Word Error Rate (WER):** Browser Web Speech API has inconsistent or non-existent support for Marathi across non-Chrome browsers, rural accents, and ambient clinic noise. | Existing code has hardcoded `recognition.lang = 'en-US'` (`TranscriptInput.tsx:64`). Zero Marathi ASR code exists. | **HIGH** | **HIGH** | Implement the Section 0 pre-agreed cut order: Run the Marathi ASR decision gate. If Bhashini/Whisper API is unavailable or WER is unacceptable, automatically fallback to **Marathi Touch-Only** questionnaire. |
| **RSK-05** | **OCR / Extraction** | **Prescription Document OCR Failure on Handwriting:** Rural Indian doctor prescriptions are overwhelmingly handwritten, often illegible, or captured via poor camera angles. Raw OCR models frequently hallucinate or produce gibberish. | Zero OCR code currently in repository. Only audio upload exists (`TranscriptInput.tsx:105-127`). | **HIGH** | **HIGH** | 1. For SIH demo, enforce synthetic printed/semi-structured prescription fixtures.<br>2. Implement deterministic regex validation on OCR output.<br>3. Require mandatory patient/clinician confirmation before adding extracted meds to `ClinicalCase`. |
| **RSK-06** | **Offline Limitations** | **Fabrication in Offline Rule Engine:** Current offline engine (`offlineLocalEngine.ts`) uses keyword matching and fabricates vitals, exams, and labs (e.g. malaria RDT POSITIVE) if keywords appear. | Implemented in `src/utils/offlineLocalEngine.ts:38-60`. | **HIGH** | **MEDIUM** | Refactor offline engine to strictly output "Not documented" instead of inventing synthetic vital signs or physical findings; preserve offline mode as emergency fallback only. |
| **RSK-07** | **Cloud Privacy / PHI** | **Cloud LLM Transmission of Clinical Data:** Transcripts and audio are transmitted to Google Gemini API (`gemini-3.6-flash`). If real patient information is entered, this breaches clinical data privacy. | Implemented in `server.ts:192-200`. | **HIGH** | **LOW (Demo context)** | Golden rule: STRICTLY SYNTHETIC DATA ONLY. Prominently display demo synthetic watermark in UI; sanitize any uploaded documents before transmission. |
| **RSK-08** | **Tunnel Exposure** | **Remote Demo Tunnel Exposure:** Opening a public tunnel (e.g. ngrok or Cloudflare Tunnel) without strict access controls exposes local development servers and API keys. | Currently local hosting only (`server.ts:238-240`). Tunnel is optional last stage. | **HIGH** | **MEDIUM** | Tunnel must never be a core dependency. When launched, protect with HTTP Basic Auth or tunnel access tokens; restrict origin to synthetic demo cases only. |
| **RSK-09** | **Human Dependency (AYUSH)** | **Unvalidated AYUSH Assessment Questions:** Introducing Ayurvedic assessment without formal review by a qualified BAMS practitioner risks clinical inaccuracy and credibility loss. | Zero AYUSH code currently exists in repository. | **MEDIUM** | **HIGH** | Implement only a thin, clinically validated slice (Prakriti + Agni). Formally require BAMS reviewer sign-off on question text and logic before merging into main flow. |
| **RSK-10** | **Human Dependency (MBBS)** | **Unverified Red-Flag Clinical Rules:** Missed myocardial infarction, stroke, or sepsis red flags in patient intake can produce catastrophic real-world failure. | Red flags currently handled generically via LLM prompts (`server.ts:128`). | **HIGH** | **MEDIUM** | Create a deterministic, hardcoded red-flag engine reviewed and approved by an MBBS clinician before demo. |
| **RSK-11** | **Security / Legacy API Surface** | **Unauthenticated Legacy Endpoint `/api/medscribe/generate` Open:** The pre-existing SOAP generation bridge `/api/medscribe/generate` remains accessible without authentication to avoid breaking the existing clinician UI (`App.tsx`) and offline fallback test suites. Any network client on the local network or tunnel can invoke Gemini on the host's API key. | Open / Backward-Compatible (`server.ts:50-234`). | **HIGH** | **MEDIUM** | In Phase 1.5/Phase 8 (Doctor Console Integration), wire the frontend API service (`src/services/api.ts`) to transmit the clinician session token (`Authorization: Bearer doc_...`) and migrate `/api/medscribe/generate` under `/api/clinician/cases/:id/generate-soap` or apply `requireClinicianAuth` once the UI clinician login is active. |


---

## 2. In-Depth Technical Risk Breakdowns

### 2.1 Drug-Interaction Dataset Limits
- **Exact Rule Count:** 9 rules in [`src/data/drugInteractions.ts:12-103`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/data/drugInteractions.ts#L12-L103).
- **Interactions Covered:**
  1. NSAIDs + Antihypertensives (ibuprofen/diclofenac vs amlodipine/lisinopril)
  2. NSAIDs in CKD/Renal Impairment
  3. Metformin in Renal Dysfunction (lactic acidosis hazard)
  4. ACE-I / ARB + Potassium / Spironolactone (hyperkalemia)
  5. Artemether/Lumefantrine + QT-prolonging drugs (ciprofloxacin, fluconazole)
  6. Amoxicillin + Allopurinol (rash)
  7. Warfarin + NSAIDs (GI bleeding)
  8. Ciprofloxacin + Cationic Antacids (absorption chelation)
  9. Paracetamol + Hepatic Impairment / Chronic Alcohol
- **Vulnerability:** If a clinician prescribes a dangerous drug pair not in these 9 rules (e.g., Sildenafil + Nitrates, Clarithromycin + Simvastatin, Methotrexate + NSAIDs), the rule engine will not trigger an alert.
- **Current Safeguard:** Lines 108-114 of `src/utils/drugInteractionChecker.ts` inject an "Unchecked Medication" alert notifying the user that the drug is absent from the curated database. This safeguard must be preserved.

### 2.2 Marathi & Hindi ASR Risks
- The current implementation in `src/components/TranscriptInput.tsx:64` hardcodes `recognition.lang = 'en-US'`.
- In Chromium on Windows/Android, setting `recognition.lang = 'mr-IN'` or `'hi-IN'` may work if network connectivity to Google's speech recognition servers is available, but is completely unsupported in Firefox, Safari, or offline environments.
- Dialectal variations in rural Maharashtra (e.g. Varhadi, Khandeshi) will cause high WER.
- **Pre-agreed Fallback Plan (Section 0 Cut Order):** If Marathi voice fails or is unreliable during initial tests, seamlessly switch Marathi mode to **Touch-Only** with large Marathi buttons and clear iconography.

### 2.3 Medical Document OCR Risks
- Adding OCR libraries like `Tesseract.js` introduces ~20MB+ of WASM/worker data, increasing initial bundle download times significantly.
- Pure client-side Tesseract has very low accuracy on Indian doctor handwriting.
- Alternative: Server-side Gemini Vision (`ai.models.generateContent` with image base64).
  - *Risk:* Requires external internet and Gemini API quota.
  - *Mitigation:* Support both synthetic sample prescription fixtures for offline/zero-latency demo and Gemini Vision for live photo uploads, with a manual editing step before confirmation.

### 2.4 Security & Session Isolation Gaps
- Currently, [`src/App.tsx:54-70`](file:///e:/BTECH%20COLLAGE/MAJOR%20FINAL%20SEM%20PROJECTS/FINAL%20YR%20PROJECT/APPLICATION%20DEVELOPMENT/REVIEW%202/29-9-26%20MedScribeAI-main/MedScribeAI-main/src/App.tsx#L54-L70) loads and saves all encounters into browser `localStorage.getItem('medscribe_lite_encounters_v1')`.
- There is no concept of a session token or patient logout. If a patient finishes entering data on a kiosk tablet and leaves, the next patient can click "History" or open the developer console and view previous patient names, ages, diagnoses, and transcripts.
- **Requirement for Phase 1:** A server-backed session lifecycle where kiosk clients obtain a short-lived token valid ONLY for submitting a single intake case. Once submitted or timed out, all client state is zeroed out.
