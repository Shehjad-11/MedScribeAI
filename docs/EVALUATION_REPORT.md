# MedScribeAI — Comprehensive System Evaluation Report

> **EVALUATION GOVERNANCE & PROTOCOL**:
> - Executed on: `2026-10-03T11:15:43.488Z`
> - Environment: Node.js / Vite / Vitest Testing Environment
> - Strict Protocol: Absolute Rule 5 enforced. **Zero invented metrics.** All missing recordings, physical scans, or external clinician sign-offs are strictly marked **NOT RUN** or **PENDING REVIEW**.

---

## 1. Executive Summary Table

| Evaluation Harness | Target Domain | Sample Size | Status | Measured Score / Result | Benchmark Threshold |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Document OCR Extraction** | Synthetic Prescriptions & Labs | 2 fixtures (4 fields) | **COMPLETE** | **100.0% Accuracy** | >= 90.0% |
| **Marathi ASR Gate** | Rural Outpatient Audio Clips | 5 registered in manifest | **NOT RUN** | **Pending Operator Audio** | WER <= 25.0% |
| **Deterministic Red-Flag Rules** | 10 Primary Care Complaints | 12 rules (15 test cases) | **COMPLETE** | **100.0% Precision** | 100% Critical Recall |
| **Deterministic Safety Engine** | Drug-Drug & Disease Rules | 9 curated rules | **COMPLETE** | **100.0% Accuracy** | 100% Curated Recall |
| **AYUSH Prakriti & Agni Assessment**| Classical Ayurvedic Tally | 8 questions (5 Prakriti, 3 Agni) | **PENDING REVIEW** | **Deterministic Tally (Unvalidated)** | Pending BAMS Sign-Off |

---

## 2. Document OCR Evaluation Details

- **Test Fixtures File**: `fixtures/documents/eval/eval_fixtures.json`
- **Sample Breakdown**:
  1. Synthetic Prescription: `eval_rx_001` (Amlodipine 5mg OD)
  2. Synthetic Lab Report: `eval_lab_002` (Fasting Blood Sugar 168 mg/dL - High)
- **Total Fields Evaluated**: 4
- **Total Fields Matched**: 4
- **Synthetic Accuracy**: 100.00%
- **Physical Document Camera Trials**: **NOT RUN** (Physical paper scans and mobile camera captures require operator-supplied image assets).

---

## 3. Marathi ASR Gate Evaluation Details

- **Manifest File**: `fixtures/audio/marathi_eval/manifest.json`
- **Registered Test Samples**: 5 speaker demographics (Male, Female, Elderly, Rural Dialect, Clinic Background Noise).
- **Physical Audio Files Present**: 0 / 5
- **Current Status**: **NOT RUN — PENDING AUDIO RECORDINGS FROM OPERATOR**
- **Evaluation Policy**:
  - The evaluation harness (`scripts/scoreAsr.ts`) is fully implemented with Levenshtein Word Error Rate (WER) and Character Error Rate (CER) calculation.
  - Per Absolute Rule 5, no synthetic WER scores are claimed until actual Marathi clinical audio recordings are provided.
  - Required recordings are cataloged in `docs/audit/ASR_GATE.md`.

---

## 4. Deterministic Red-Flag Triage Engine

- **Rules Evaluated**: Exactly 12 versioned rules across 10 primary care complaints.
- **Rule Version Tagging**: 100% of generated alerts strictly carry `ruleVersion: "1.0.0"`.
- **Test Invariants**:
  - **Positive Triggers** (8 cases): Correctly triggered Priority 1 STAT / EMERGENCY for acute chest pain with diaphoresis/radiation (`RF-CARD-001`), acute respiratory distress (`RF-RESP-001`), thunderclap headache (`RF-NEURO-001`), peritoneal rigidity (`RF-GI-001`), petechial purpura (`RF-HEM-001`), etc.
  - **Negative Benign Scenarios** (4 cases): Zero false-positive red flags for mild cough, routine headache, low-grade short-duration fever.
  - **Boundary Thresholds** (3 cases): Fever duration 6 days (benign) vs 7 days (`RF-FEV-001` triggered); pain score 6 (normal) vs 7 (severe).
- **Status in Clinical Spec**: Marked **PENDING CLINICIAN REVIEW** in `docs/CLINICAL_SPEC.md`.

---

## 5. Curated Clinical Safety Engine

- **Curated Dataset Scope**: Exactly 9 high-risk primary care interaction rules (`src/data/drugInteractions.ts`).
- **Tested Interactions**:
  1. Aspirin + Warfarin (Severe Bleeding Risk) — DETECTED
  2. NSAID + ACE Inhibitor (Acute Kidney Injury) — DETECTED
  3. Metformin + Renal Impairment (Lactic Acidosis Precaution) — DETECTED
  4. Duplicate Prescriptions — DETECTED
  5. Uncurated Medication Warning — DETECTED (No false sense of safety)
- **Mandatory UI Text**: Explicit disclosure rendered in `SafetyAlertsPanel.tsx` stating dataset size (9 rules) and that absence of an alert is NOT proof of clinical safety.

---

## 6. AYUSH Prakriti & Agni Thin Slice

- **Questions**: 5 Sharira Prakriti questions, 3 Jatharagni questions (`src/data/ayush/prakritiAgniRules.ts`).
- **Scoring Logic**: Transparent tally counting of dosha dominance (Vata, Pitta, Kapha, Dvandvaja) and Agni type (Vishama, Tikshna, Manda, Sama).
- **Clinical Review Status**: Strictly stamped **PENDING BAMS REVIEW** in all UI components, API payloads, and documents.
- **Review Packet**: Delivered in `docs/AYUSH_REVIEW_PACKET.md` for independent Ayurvedic clinician sign-off.
