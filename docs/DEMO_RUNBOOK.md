# MedScribeAI — Master Demonstration Runbook & Failure Drills

> **Demonstration Spec**: MASTER_PROMPT Phase 15  
> **Evaluation Event**: Smart India Hackathon (SIH 2026) / B.Tech AI & ML Final Evaluation  
> **Target Audience**: Clinical Evaluators, Technical Judges, Healthcare Jurors  
> **Strict Operational Invariant**: **A failed live service must NEVER silently switch to fabricated clinical output.** Missing facts are always stamped `"Not documented"` or fail gracefully with transparent diagnostic banners. Clinician review and approval is mandatory before any clinical plan or export is finalized.

---

## 1. Pre-Demo Setup & Environment Checklist (5 Minutes Before Demo)

1. Open PowerShell in the project root:
   ```powershell
   # Ensure dependencies and clean build are in place
   npm run build
   # Seed fresh 5-patient synthetic demonstration dataset
   npm run db:seed
   # Launch production server
   npm start
   ```
2. Verify system health at `http://localhost:3000/api/health`:
   ```json
   {
     "status": "ok",
     "app": "MedScribeAI",
     "version": "1.0.0",
     "sqlite": "connected",
     "activeCasesCount": 5,
     "geminiConfigured": true
   }
   ```
3. Open two browser windows side by side:
   - **Window 1 (Patient Kiosk)**: `http://localhost:3000` (Patient Kiosk Shell)
   - **Window 2 (Doctor Workstation)**: `http://localhost:3000` (Triage Queue / Clinician Console)
4. Clinician Login (Demo Account):
   - **Username**: `doctor`
   - **Password**: `medscribe2026`

---

## 2. Scripted Primary Scenario: 52-Year-Old Acute Coronary Risk (7 Minutes)

### Phase A: Multilingual Patient Kiosk Intake (0:00 - 2:00)
1. **Language Selection**:
   - On the kiosk screen, touch **"मराठी (Marathi)"** or **"हिंदी (Hindi)"**.
   - Show the evaluator how the interface, touch targets, and disclaimers dynamically adapt to Indic scripts.
2. **Identification**:
   - Enter mock ABHA ID: `91-5544-3322-1100`.
   - Touch **"Verify ABHA"** -> Instantly verifies Ramesh Kumar Patil, 52, Male, Pune district, clearly showing the disclaimer: `MOCK ABHA ADAPTER — SYNTHETIC DATA ONLY`.
3. **Consent & Privacy Fencing**:
   - Walk through the 5 granular consent toggles (History, Voice, Documents, Cloud AI, FHIR Export).
   - Point out the **"Local-Only Mode"** toggle: explain how primary clinics without reliable internet can lock all AI processing to the device.
4. **Symptom Intake & Red-Flag Detection**:
   - Select **"छातीत दुखणे (Chest Pain)"** from the 10-complaint touch grid.
   - Enter onset: `"2 hours ago"`.
   - In questionnaire, select radiation to `"Left arm and jaw"` and diaphoresis (cold sweats) `"Yes"`.
   - Touch **"Submit Intake"**.
   - **Result**: The deterministic red-flag engine triggers rule `RF-CARD-001` (Acute Coronary Syndrome risk) and assigns **Priority 1 (EMERGENCY)**.

---

### Phase B: Clinician Priority Queue & Triage Workstation (2:00 - 3:30)
1. Switch to Window 2 (**Clinician Console**):
   - Touch **"Triage Queue"** in the navigation header.
   - Show how the priority sorting algorithm places Ramesh Kumar Patil at the **very top** with a pulsing red `EMERGENCY STAT` badge.
2. **Clinical Provenance Inspection**:
   - Click on the patient case to inspect details.
   - Point out the provenance badges:
     - `PATIENT_REPORTED [touch]` (Intake symptoms)
     - `DOCUMENT_EXTRACTED [ocr]` (Amlodipine 5mg prescription)
     - Stamped rule version: `ruleVersion: 1.0.0` on every alert.
   - Show the AYUSH card: Clearly displays `[PENDING BAMS REVIEW]` to demonstrate zero medical overclaiming.
3. Click **"Load into Doctor Consultation"**:
   - Case data, demographics, past history, and medications automatically populate the clinical workspace.

---

### Phase C: Unified SOAP Note Synthesis & Deterministic Safety Engine (3:30 - 5:00)
1. **Consultation Transcript**:
   - The primary scenario consultation dialogue is loaded.
2. **Generate Clinical Documentation**:
   - Click **"Generate Clinical Documentation"**.
   - In online mode, Gemini synthesizes structured SOAP with LOINC and ICD-10 suggestions.
   - In offline mode, the deterministic Offline Local Engine instantly parses the consultation without internet.
3. **Safety Copilot & 9-Rule Engine**:
   - Point to the **Clinical Safety Alerts Panel**:
   - Mandatory UI disclosure is prominently displayed:
     > *"The deterministic safety engine evaluates prescribed therapies against a curated dataset of exactly 9 high-risk primary care interaction rules. The absence of an alert is NOT proof of clinical safety. Prescribing physician review and verification remains mandatory."*
   - Show the detected drug-drug interaction alerts (concurrent antiplatelet loading + existing cardiovascular therapies).

---

### Phase D: Clinician Approval Gate & FHIR R4 Provenance Export (5:00 - 6:00)
1. **Mandatory Approval Gate**:
   - Show the evaluator that notes are in a draft state and cannot be pushed to ABDM or exported to FHIR until signed off.
   - The clinician edits the plan if necessary and clicks **"Approve & Sign Clinical Note"**.
   - SQLite stores: `originalAiOutput`, `editedOutput`, `reviewer: "Dr. Primary Care"`, and `approvedAt` timestamp.
2. **FHIR R4 Export**:
   - Click **"Export FHIR R4 Bundle"**.
   - View the generated JSON bundle containing `Patient`, `Condition` (ICD-10 `I21.9`), `MedicationRequest`, and a first-class `Provenance` resource linking the doctor.
3. **Mock ABDM Push**:
   - Click **"Push to ABDM"** -> Simulates ABDM M1/M2/M3 care context push with explicit mock disclaimer.

---

## 3. Seven High-Impact Failure Drills (Demonstrating Resilience)

| Drill # | Simulated Failure Condition | Expected System Behavior | Invariant Verified |
| :--- | :--- | :--- | :--- |
| **Drill 1** | **Internet Disconnected** | Amber banner: `Offline Engine Active`. Local NLP parses transcript. | Zero downtime in rural health centers; never crashes. |
| **Drill 2** | **Gemini Quota Exhausted** | Returns HTTP 500/429 -> Client triggers offline fallback. | **NEVER fabricates synthetic hallucinated clinical output.** |
| **Drill 3** | **OCR Unreadable Document** | Upload validation rejects or classifies as UNKNOWN. Manual entry fallback active. | No false clinical extractions on blurry scans. |
| **Drill 4** | **ASR Microphone Denied** | Displays permission recovery instructions; falls back to manual typing. | Clinical consultation continues uninterrupted. |
| **Drill 5** | **SQLite DB Restart** | SQLite re-opens in WAL mode; existing confirmed cases remain intact. | Zero data loss on power flicker. |
| **Drill 6** | **Abandoned Kiosk Session** | 3-minute idle timer fires; wipes draft and deletes unsubmitted facts. | Strict cross-patient privacy isolation (Patient B never sees Patient A). |
| **Drill 7** | **Tampered Encrypted Document** | AES-256-GCM auth tag verification fails; decryption throws error. | Confidentiality & tamper-proofing at rest verified. |

---

## 4. Key Takeaways for Evaluators

1. **Medical Safety First**: The LLM is strictly a documentation assistant, NEVER the diagnostic authority or safety arbiter.
2. **Rural Reality Focus**: Multilingual Indic UI (Marathi/Hindi/English), 100% offline fallback capability, touch-first accessibility.
3. **Rigorous Engineering**: 166 automated unit/integration tests passing with 0 regressions, zero committed secrets, clean `npm audit` (0 vulnerabilities).
4. **Honest Governance**: Real fixtures evaluated; unsupplied audio or reviewer sign-offs are transparently stamped **NOT RUN** or **PENDING REVIEW**.
