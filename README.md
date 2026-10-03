# MedScribe Lite — Primary Care AI Clinical Assistant & Safety Copilot

> **Empowering rural health posts and low-resource primary care clinics with real-time consultation transcribing, AI clinical safety guardrails, drug interaction checking, documentation confidence scoring, and HL7 FHIR export.**

---

## 🌟 Key Features

- **Clinical Consultation Scribing**: Transforms patient dictations or live consultation transcripts into structured, audit-ready SOAP notes (Subjective, Objective, Assessment, Plan).
- **Clinical Safety Copilot Guardrails**: Audits consultation notes in real-time against medical safety guidelines, flagging clinical uncertainties and dosage risks.
- **Deterministic Drug Interaction Engine**: Detects high- and medium-severity drug-drug interactions, drug-condition contraindications, and documented allergy conflicts offline.
- **Documentation Confidence Scoring**: Assigns overall and per-section completeness metrics with rationale popovers and missing information checklists.
- **HL7 FHIR R4 JSON Export**: Interoperable standard export (`Patient`, `Encounter`, `Condition` with ICD-10, `MedicationRequest`, and `Composition` with LOINC codes) for seamless EHR integration.
- **Offline / Local Model Mode**: Browser-native clinical NLP fallback engine allowing 100% functionality without internet connection or backend API availability.
- **ICD-10 & CPT Billing Suggestions**: Automatic coding recommendations to streamline clinic reimbursement.

---

## 🚀 Quick Start & Local Deployment

### Prerequisites
- Node.js (v18+)
- npm

### Option A: One-Command Windows Setup
Double-click `setup.bat` or run in PowerShell:
```powershell
.\setup.ps1
```
This automatically verifies Node.js, creates `.env` from `.env.example`, installs dependencies, builds the bundle, and seeds the synthetic demo cases.

### Option B: Manual Step-by-Step Setup

1. **Clone repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and insert your GEMINI_API_KEY if testing cloud features
   ```

3. **Seed Synthetic Demonstration Dataset**:
   ```bash
   npm run db:seed
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Run the Full Test Suite**:
   ```bash
   npm test
   ```

6. **Run System Evaluation Harness**:
   ```bash
   npm run eval
   ```

7. **Production Mode (Bundled)**:
   ```bash
   npm run build
   npm start
   ```

### Default Clinician Login (Demo Account)
- **Username**: `doctor`
- **Password**: `medscribe2026`
*(Loaded strictly via environment variables `CLINICIAN_USER` and `CLINICIAN_PASS`)*


---

## 📸 Application Screenshots

### Patient Intake & Consultation Interface
![Patient Intake Interface](Screenshots/Screenshot%202026-08-17%20211450.png)

### Clinical Notes Generation & SOAP Formatting
![Clinical Notes Generation](Screenshots/Screenshot%202026-08-17%20212058.png)

### Safety Copilot & Drug Interaction Checking
![Safety Copilot Interface](Screenshots/Screenshot%202026-08-17%20212110.png)

### Documentation Confidence Scoring & Verification
![Confidence Scoring](Screenshots/Screenshot%202026-08-17%20212124.png)

### FHIR Export & Billing Code Suggestions
![FHIR Export & Billing](Screenshots/Screenshot%202026-08-17%20212156.png)

---

## 🔒 Security & Privacy

MedScribe Lite is designed with strict data privacy principles for clinical settings:
- No patient health information (PHI) is persisted on external servers.
- Browser-local storage option for encounter records.
- Zero-network offline local mode for air-gapped clinical operation.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
