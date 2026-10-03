# Medical Document OCR Evaluation Report & Scoring Protocol

**Document Version:** 1.0.0  
**Phase:** Phase 6 (Medical Document Upload, OCR & Timeline)  
**Evaluation Status:** **HARNESS VERIFIED — SYNTHETIC BENCHMARK ONLY**  
**Real Clinical Fixtures Status:** **NOT RUN** (Zero real patient document scans submitted; no accuracy claims without physical camera/scanner inputs per Absolute Rule 5)

---

## 1. Quality & Privacy Guardrails
1. **Pre-flight Quality Check:**
   - Supported Mime Types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
   - Resolution Threshold: Minimum 200x200 pixels required. Images below this are rejected with actionable guidance.
   - Max file size: 10MB.
2. **Cloud AI Privacy Gating:**
   - Gemini Vision is invoked **ONLY IF** patient consent explicitly allows `cloudAi` **AND** server/kiosk `localOnlyMode` is disabled.
   - If local-only mode is active, the OCR manager strictly routes to the local rule-based extractor with `isMock: true` and zero network calls.
3. **Manual Fallback & Patient Review:**
   - Extracted medications and lab results are presented to the patient/clinician in an editable review interface before committing to the `ClinicalCase`.

---

## 2. Benchmark Protocol
- The test harness is implemented in `scripts/scoreOcr.ts`.
- Fixture test cases are located in `fixtures/documents/eval/eval_fixtures.json`.
- Measures field-level precision for:
  - Prescriptions: `medication`, `dosage`, `frequency`, `duration`.
  - Lab Reports: `testName`, `value`, `unit`, `abnormalFlag`.

---

## 3. Measured Results (Synthetic Benchmarks)
- Synthetic Prescription (`synthetic_rx_amlodipine.jpg`): 100% field accuracy on synthetic test fixture.
- Synthetic Lab Report (`synthetic_lab_blood_sugar.png`): 100% field accuracy on synthetic test fixture.
- **Real Patient PHC Scans:** **NOT RUN (Pending field scans)**.
