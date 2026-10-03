# Product Requirements Document (prd.md)

---

## 1. Feature Matrix: Implemented vs. Planned

| Feature Category | Feature Description | Implemented Component / File | Status | Scope Tier |
| :--- | :--- | :--- | :--- | :--- |
| **Patient Demographics** | Form for patient name, age, biological sex, medical history, current meds, allergies, encounter type, and clinic location. | `src/components/PatientForm.tsx` | Implemented | MVP / Hackathon Scope |
| **Dictation & Audio** | Ambient Web Speech API live speech-to-text dictation & 25MB max audio file upload preview/playback. | `src/components/TranscriptInput.tsx` | Implemented | MVP / Hackathon Scope |
| **Sample Scenarios** | 5 pre-populated clinical scenario pills (Malaria, Hypertension/Diabetes, Pediatric Otitis Media, Antenatal Care, Gastroenteritis). | `src/data/sampleScenarios.ts` | Implemented | MVP / Hackathon Scope |
| **SOAP Note Generation** | Express server bridge calling Gemini 3.6 Flash with 100% fact-extraction guardrails to output structured JSON SOAP note. | `server.ts` | Implemented | MVP / Hackathon Scope |
| **SOAP Note Display & Edits** | Interactive tabbed view (S, O, A, P), inline editing of fields, text-to-speech read aloud, and plain-text EHR copy format. | `src/components/SOAPNoteView.tsx` | Implemented | MVP / Hackathon Scope |
| **Clinical Safety Alerts** | Automated detection of drug-drug interactions, allergy flags, missing information, and clinical uncertainty indicators. | `src/components/SafetyAlertsPanel.tsx` | Implemented | MVP / Hackathon Scope |
| **Billing & Coding** | Automated ICD-10 diagnostic code suggestions with confidence scores and CPT Evaluation & Management codes with rationales. | `src/components/BillingCodingPanel.tsx` | Implemented | MVP / Hackathon Scope |
| **Prescription Slip** | Printable modal dialog formatted for patient prescription and home care instructions. | `src/components/PrintPrescriptionModal.tsx` | Implemented | MVP / Hackathon Scope |
| **Encounter History** | Browser LocalStorage persistence (`medscribe_lite_encounters_v1`) with search, filter, and reload functionality. | `src/components/EncounterHistoryModal.tsx` | Implemented | MVP / Hackathon Scope |
| **Clinic Productivity Metrics** | Analytics modal calculating total encounters, hours saved, safety flags audited, and top documented diagnoses breakdown. | `src/components/ClinicAnalyticsModal.tsx` | Implemented | MVP / Hackathon Scope |
| **Branding & Packaging** | Unified logo, brand lockup, clean header navigation without raw model version badges or hackathon tags. | `src/components/Header.tsx` | Planned | Startup-Grade Scope |
| **Landing Page** | Public-facing landing page showcasing product value proposition, problem, workflow screenshots, and pricing tiers. | TBD | Planned | Startup-Grade Scope |
| **Automated Testing** | Unit tests for components, API endpoint tests for `server.ts`, and end-to-end user flow testing harness. | TBD | Planned | Startup-Grade Scope |
| **CI/CD Pipeline** | GitHub Actions workflow for linting, type-checking (`tsc --noEmit`), building, and running automated test suites. | TBD | Planned | Startup-Grade Scope |
| **Production Error Handling** | Resilience against API rate limits, network timeouts, invalid JSON responses, and offline fallback modes. | `src/App.tsx`, `server.ts` | Partially Implemented | Startup-Grade Scope |
| **Security & Compliance** | Formal security disclosure policy (`SECURITY.md`), LICENSE declaration, and HIPAA/GDPR synthetic data posture. | TBD | Planned | Startup-Grade Scope |

---

## 2. Requirement Scope Separation

### MVP / Hackathon Scope (Completed Core)
- Local browser dictation, transcript parsing, sample scenario library.
- Direct integration with `@google/genai` on Express backend (`server.ts`).
- Core 4-section SOAP note view, prescription table edit, EHR copy, and print slip.
- Client-side LocalStorage history and basic analytics breakdown.

### Startup-Grade Requirements (Next Phase Work)
- **Branding & Polish:** De-hackathon-ify UI text, add legal/security headers, create crisp logo asset.
- **Product Landing Page:** Convert prospective clinic leads with visual workflow explanations.
- **Robust Code Quality:** Break down 772-line `SOAPNoteView.tsx` into modular React components, establish CSS token framework.
- **Automated Verification:** Configure Vitest / React Testing Library suite and GitHub Actions workflow.
- **Security & Compliance Posture:** Formalize security policy, open-source license, and documented environment variable handling.

---

## 3. Monetization & Three-Tier Pricing Structure

| Tier Name | Target Customer Segment | Pricing | Key Capabilities & Limits |
| :--- | :--- | :--- | :--- |
| **Community Outreach (Free)** | Solo rural health workers, mobile clinics, open-source testers | *$0* / month** | Ambient dictation, 5 sample clinical scenarios, standard Gemini 3.6 SOAP generation, client-side LocalStorage history, basic drug safety alerts, printable prescription slips. |
| **Independent Clinic ($19/mo)** | Small independent clinics & community health centers (1-5 providers) | **$19 / clinic / mo** | Everything in Free + priority API throughput, custom clinic header on printable prescriptions, FHIR/EHR export options, unlimited encounter history export, automated Clinical Safety Copilot guardrails audit. |
| **Multi-Provider Health Center ($49/mo)** | Regional primary care networks & multi-provider health facilities | **$49 / center / mo** | Everything in Clinic + multi-provider team workspaces, role-based access control, localized drug interaction overrides, regional ICD-10/CPT coding custom rules, priority SLA support. |

