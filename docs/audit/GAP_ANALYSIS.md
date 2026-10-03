# MedScribeAI — Gap Analysis (Phase 0 Audit)

**Inspection Date:** 2026-10-03  
**Auditor:** Lead Software & Healthcare Architect (Antigravity Agent)  
**Specification Reference:** `docs/MASTER_PROMPT.md` (Section 0: Scope Tiers; Section 36: Existing Features That Must Not Be Lost)

---

## 1. Overview of Scope Tiers & Strategy

- **Tier 1 (MUST / SIH Demo-Critical):** Features mandatory for a coherent, trustworthy SIH presentation.
- **Tier 2 (SHOULD / Post-Core Polish):** Secondary capabilities to implement only after Tier 1 is stable.
- **Tier 3 (COULD / Deferred Scope):** Commercial, regional, or enterprise features that must not delay the core demo.
- **Section 36 Features:** Working capabilities in the repository that must be preserved without regression.

---

## 2. Comprehensive Gap Analysis Table

| # | Feature | Existing Status | Current Location | Tier | Reuse / Modify / New | Dependencies | Risk | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TIER 1 MUST** | | | | | | | | |
| T1.1 | English/Hindi/Marathi language selection | Partially Implemented (EN and ES only; NO Hindi, NO Marathi) | `src/i18n/LanguageContext.tsx:5`, `src/i18n/locales/` | 1 | Modify | Locale files for HI, MR; Font support | Low (UI text dictionaries) | Passing for EN/ES (`multiLanguagePipeline.test.tsx`); Untested for HI/MR |
| T1.2 | Explicit patient consent | Missing | None | 1 | New | None (local state + DB schema) | Low | Untested |
| T1.3 | Patient identification / temporary registration | Partially Implemented (Demographics form in Doctor UI only) | `src/components/PatientForm.tsx:1-193` | 1 | Modify | Local/Server session state | Low | Passing smoke test (`components.test.tsx`) |
| T1.4 | Ten initial complaint templates | Missing (Only 5 doctor-side encounter scenarios exist) | `src/data/sampleScenarios.ts:1-150` | 1 | New | Clinical question graph | Medium (Requires clinical curation) | Untested |
| T1.5 | Touch-based patient interaction | Missing (No kiosk/patient-facing UI) | None | 1 | New | Tailwind UI components | Low | Untested |
| T1.6 | Voice interaction with tested ASR path | Partially Implemented (Web Speech API with hardcoded `en-US`; NO Marathi/Hindi) | `src/components/TranscriptInput.tsx:37-90` | 1 | Modify | Web Speech API / Bhashini / Whisper | High (Marathi ASR accuracy & browser support) | Manual verified; No automated audio unit test |
| T1.7 | Deterministic clinical question graph | Missing | None | 1 | New | Medical branching tree logic | Medium (Requires clinical validation) | Untested |
| T1.8 | Structured patient history | Partially Implemented (Freeform text fields: medicalHistory, currentMeds, allergies) | `src/types.ts:7-9`, `PatientForm.tsx` | 1 | Modify | `ClinicalCase` schema | Low | Passing smoke test |
| T1.9 | Deterministic red-flag detection | Partially Implemented (Generic alerts via LLM + offline keyword rules) | `server.ts:128`, `offlineLocalEngine.ts` | 1 | New (as dedicated deterministic engine) | Rule database for emergency signs | High (Clinical safety failure if missed) | Untested specifically for emergency flags |
| T1.10 | Medical document upload/capture | Missing (Audio upload exists, but no image/PDF document upload) | `TranscriptInput.tsx:105-127` (audio only) | 1 | New | File input, canvas/image preview | Low | Untested |
| T1.11 | OCR → structured extraction → timeline | Missing | None | 1 | New | Tesseract.js / Gemini Multimodal / Rule parser | High (Handwriting variance, latency, bundle size) | Untested |
| T1.12 | Source/provenance for clinical facts | Missing (All fields flat strings without attribution) | `src/types.ts:22-48` | 1 | New | Provenance data model | Medium | Untested |
| T1.13 | Patient review and confirmation | Missing | None | 1 | New | Kiosk review screen component | Low | Untested |
| T1.14 | Central ClinicalCase domain object | Missing (Only loosely-typed `PatientInfo` and `EncounterRecord`) | `src/types.ts:1-12, 102-110` | 1 | New | SQLite persistence layer | Medium (Architectural centerpiece) | Untested |
| T1.15 | Doctor queue / patient-ready summary | Missing (Direct patient form entry only; no queue) | None | 1 | New | Queue view component + API | Low | Untested |
| T1.16 | Existing doctor consultation workflow | Implemented | `src/App.tsx:201-381`, `SOAPNoteView.tsx` | 1 | Reuse | Existing UI components | Low | Passing (`components.test.tsx`) |
| T1.17 | Existing SOAP generation | Implemented (via Gemini Cloud API + Offline engine) | `server.ts:38-221`, `offlineLocalEngine.ts:10-191` | 1 | Reuse | `@google/genai` | Low | Passing (`resilienceAndEdgeCases.test.tsx`) |
| T1.18 | Deterministic medication/allergy safety checks | Implemented (9 curated rules + allergy matching + duplicate Rx detection) | `src/utils/drugInteractionChecker.ts:8-118`, `src/data/drugInteractions.ts:12-103` | 1 | Reuse & Extend | Curated interaction database | Medium (Only 9 rules exist; unchecked drugs flagged) | Passing (5/5 tests in `drugInteractions.test.tsx`) |
| T1.19 | Mandatory clinician review and approval | Partially Implemented (UI edit tabs exist, but no explicit sign-off state/audit) | `src/components/SOAPNoteView.tsx:308-312` | 1 | Modify | Status transition in `ClinicalCase` | Low | Passing basic render |
| T1.20 | HL7 FHIR R4 export | Implemented (In-memory Bundle generator: Patient, Encounter, Condition, MedicationRequest, Composition) | `src/utils/fhirConverter.ts:23-280` | 1 | Reuse & Adapt | `ClinicalCase` mapping | Low | Passing (6/6 tests in `fhirConverter.test.tsx`) |
| T1.21 | Kiosk/session wipe and patient isolation | Missing (No session wipe, no route separation, shared localStorage) | `src/App.tsx:54-70` | 1 | New | Session token manager + reset endpoint | High (Data leakage between patients) | Untested |
| T1.22 | Robust DEMO MODE using synthetic data | Partially Implemented (5 synthetic scenarios in doctor view) | `src/data/sampleScenarios.ts:1-150` | 1 | Modify | Synthetic patient fixture library | Low | Passing (`multiLanguagePipeline.test.tsx`) |
| T1.23 | Local hosting architecture | Implemented (Express server serving Vite SPA locally on port 3000) | `server.ts:223-241` | 1 | Reuse | Node.js / Express | Low | Passing build & start |
| T1.24 | Protected tunnel for remote demonstration | Missing | None | 1 (Opt) | New (Last Stage) | Cloudflare Tunnel / Ngrok + Basic Auth | High (Exposure risk if unauthenticated) | Untested |
| T1.25 | AYUSH mode (thin clinically reviewed slice: Prakriti/Agni) | Missing | None | 1 | New | BAMS clinical review of questions | High (Requires external clinical signoff) | Untested |
| **TIER 2 SHOULD** | | | | | | | | |
| T2.1 | Documentation confidence scoring | Implemented | `server.ts:137-159`, `DocumentationConfidenceBadge.tsx` | 2 | Reuse | Existing heuristic scoring | Low | Passing (2/2 tests in `documentationConfidence.test.tsx`) |
| T2.2 | ICD-10 suggestions | Implemented | `server.ts:111-117`, `BillingCodingPanel.tsx:57-89` | 2 | Reuse | Gemini / Offline rule mapping | Low | Passing |
| T2.3 | Marathi voice/polish improvements | Missing | None | 2 | New | ASR audio processing / Bhashini | High | Untested |
| T2.4 | Audit logging | Missing | None | 2 | New | SQLite audit log table | Low | Untested |
| T2.5 | Better document provenance UI | Missing | None | 2 | New | Provenance tooltip / badge components | Low | Untested |
| T2.6 | More complete patient history fields | Missing (Currently basic string fields) | `src/types.ts:7-9` | 2 | Modify | `ClinicalCase` schema extensions | Low | Untested |
| T2.7 | Expanded AYUSH assessment fields (Vikriti, Dhatus, Sara, etc.) | Missing | None | 2 | New | BAMS expert validation | High | Untested |
| T2.8 | Better offline synchronization | Missing (Currently in-memory/localStorage only) | `src/App.tsx:107-154` | 2 | New | Background sync / SQLite offline queue | Medium | Untested |
| T2.9 | Basic clinic analytics | Implemented | `src/components/ClinicAnalyticsModal.tsx:1-134` | 2 | Reuse | Encounters aggregation logic | Low | Passing (`components.test.tsx`) |
| T2.10 | Additional synthetic evaluation cases | Partially Implemented (5 cases exist) | `src/data/sampleScenarios.ts` | 2 | Modify | Test fixtures | Low | Passing |
| **TIER 3 COULD** | | | | | | | | |
| T3.1 | CPT expansion | Partially Implemented (Basic CPT suggestions exist; US-only) | `server.ts:118-124`, `BillingCodingPanel.tsx:91-122` | 3 | Preserve (Do Not Expand) | None | Low | Passing |
| T3.2 | Advanced analytics | Missing | None | 3 | Defer | None | Low | N/A |
| T3.3 | Advanced triage dashboard | Missing | None | 3 | Defer | None | Low | N/A |
| T3.4 | Team workspaces | Missing | None | 3 | Defer | None | Medium | N/A |
| T3.5 | Advanced RBAC | Missing | None | 3 | Defer | Auth provider | Medium | N/A |
| T3.6 | Real ABDM integration (M1/M2/M3 bridges) | Missing | None | 3 | Defer (Synthetic FHIR only) | ABDM sandbox APIs | High | N/A |
| T3.7 | Mobile/PWA production hardening | Missing | None | 3 | Defer | Service worker, manifest | Low | N/A |
| T3.8 | Large language/document model upgrades | Missing | None | 3 | Defer | On-prem models | High | N/A |
| T3.9 | District-scale deployment features | Missing | None | 3 | Defer | Cloud clustering | High | N/A |
| T3.10 | Commercial pricing implementation | Implemented in marketing page only (₹0/₹199/₹499) | `src/components/LandingPage.tsx:180-260` | 3 | Preserve (Do Not Lead) | None | Low | Passing |
| T3.11 | Additional complaints beyond initial 10 | Missing | None | 3 | Defer | Clinical graphs | Low | N/A |
| T3.12 | Advanced billing/package-code workflows | Missing | None | 3 | Defer | Indian package codes | Medium | N/A |
| **SECTION 36 EXISTING FEATURES** | | | | | | | | |
| S36.1 | Gemini clinical reasoning | Implemented | `server.ts:38-202` | 1 | Reuse | `@google/genai` | Low | Passing |
| S36.2 | SOAP generation | Implemented | `server.ts`, `SOAPNoteView.tsx` | 1 | Reuse | React / Server | Low | Passing |
| S36.3 | Anti-hallucination prompts | Implemented | `server.ts:56-60, 71-74` | 1 | Reuse | Prompt constraints | Low | Passing |
| S36.4 | Deterministic safety | Implemented | `src/utils/drugInteractionChecker.ts` | 1 | Reuse | Pure TypeScript | Low | Passing (5/5 tests) |
| S36.5 | Drug interaction checking | Implemented | `src/data/drugInteractions.ts:12-103` | 1 | Reuse | Pure TypeScript | Low | Passing (5/5 tests) |
| S36.6 | Allergy checking | Implemented | `drugInteractionChecker.ts:18-32` | 1 | Reuse | Pure TypeScript | Low | Passing |
| S36.7 | Documentation scoring | Implemented | `server.ts:137-159`, `DocumentationConfidenceBadge.tsx` | 2 | Reuse | React | Low | Passing (2/2 tests) |
| S36.8 | Missing-information flags | Implemented | `DocumentationConfidenceBadge.tsx:43-52` | 2 | Reuse | React | Low | Passing |
| S36.9 | ICD-10 suggestions | Implemented | `BillingCodingPanel.tsx:57-89` | 2 | Reuse | React | Low | Passing |
| S36.10| Existing CPT functionality | Implemented | `BillingCodingPanel.tsx:91-122` | 3 | Reuse (Preserve As-Is) | React | Low | Passing |
| S36.11| Confidence scores | Implemented | `src/types.ts:83-89`, `SOAPNoteHeader.tsx` | 2 | Reuse | React | Low | Passing |
| S36.12| Billing rationale | Implemented | `BillingCodingPanel.tsx:112-114` | 3 | Reuse | React | Low | Passing |
| S36.13| FHIR R4 export | Implemented | `src/utils/fhirConverter.ts:23-280` | 1 | Reuse | Pure TypeScript | Low | Passing (6/6 tests) |
| S36.14| Offline NLP fallback | Implemented | `src/utils/offlineLocalEngine.ts:10-191` | 1 | Reuse | Pure TypeScript | Low | Passing (5/5 tests) |
| S36.15| Clinician review UI | Implemented | `SOAPNoteView.tsx:308-312` | 1 | Reuse | React | Low | Passing |
| S36.16| Prescription printing | Implemented | `src/components/PrintPrescriptionModal.tsx:1-143` | 1 | Reuse | CSS Print / React | Low | Passing |
| S36.17| Read Aloud (Speech synthesis) | Implemented | `src/components/soap-note/SOAPNoteHeader.tsx:64-88` | 1 | Reuse | Web Speech API | Low | Passing |
| S36.18| Copy for EHR | Implemented | `src/components/soap-note/SOAPNoteHeader.tsx:90-112` | 1 | Reuse | Clipboard API | Low | Passing |
| S36.19| Encounter history | Implemented | `src/components/EncounterHistoryModal.tsx:1-145` | 1 | Reuse (Upgrade to SQLite) | LocalStorage | Low | Passing |
| S36.20| Analytics | Implemented | `src/components/ClinicAnalyticsModal.tsx:1-134` | 2 | Reuse | React | Low | Passing |
| S36.21| Multilingual support | Implemented (EN/ES) | `src/i18n/` | 1 | Modify (Add HI/MR) | React Context | Low | Passing (5/5 tests) |
| S36.22| React 19 / Vite 6 | Implemented | `package.json:22-24` | 1 | Reuse | Core Stack | Low | Passing build |
| S36.23| Express / TypeScript | Implemented | `package.json:19, 37`, `server.ts` | 1 | Reuse | Core Stack | Low | Passing build |
| S36.24| Vitest / React Testing Library | Implemented | `package.json:27-28, 39` | 1 | Reuse | Core Stack | Low | Passing (46/46 tests) |
| S36.25| GitHub Actions CI | Implemented | `.github/workflows/ci.yml:1-36` | 1 | Reuse | GitHub Actions | Low | Passing |
