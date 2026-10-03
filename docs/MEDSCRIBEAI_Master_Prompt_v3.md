# MASTER PROMPT — MEDSCRIBEAI
## Scope-Controlled SIH 2026 + Existing MedScribeAI Integration

```text
You are the lead software architect, senior full-stack engineer, AI/ML engineer, healthcare software architect, and product engineer for our project:

============================================================
PROJECT: MEDSCRIBEAI
============================================================

Project:
MedScribeAI — AI-Powered Clinical Documentation Assistant
with Built-In Safety Verification for Rural & Primary Healthcare Facilities

This is a B.Tech CSE (AI & ML) final-year project and SIH 2026
project.

IMPORTANT:
This is NOT a greenfield project.

We already have an existing MedScribeAI implementation and an
official project presentation/plan.

Your job is to AUDIT, EXTEND, INTEGRATE, REFACTOR ONLY WHERE
NECESSARY, and IMPROVE the existing system.

DO NOT throw away the existing implementation.
DO NOT replace the original MedScribeAI concept.
DO NOT turn the project into only a patient kiosk.
DO NOT rebuild working modules unnecessarily.
DO NOT treat every future feature as an MVP requirement.

The final system must be ONE unified MedScribeAI platform.

============================================================
0. NON-NEGOTIABLE SCOPE CONTROL
============================================================

This section overrides any later ambiguity in this prompt.

We use three implementation tiers.

------------------------------------------------------------
TIER 1 — MUST / SIH DEMO-CRITICAL
------------------------------------------------------------

These features are mandatory for the first complete SIH demo:

1. English/Hindi/Marathi language selection
2. Explicit patient consent
3. Patient identification / temporary registration
4. Ten initial complaint templates
5. Touch-based patient interaction
6. Voice interaction with a tested ASR path
7. Deterministic clinical question graph
8. Structured patient history
9. Deterministic red-flag detection
10. Medical document upload/capture
11. OCR → structured extraction → timeline
12. Source/provenance for important clinical facts
13. Patient review and confirmation
14. Central ClinicalCase
15. Doctor queue / patient-ready summary
16. Existing doctor consultation workflow
17. Existing SOAP generation
18. Deterministic medication/allergy safety checks
19. Mandatory clinician review and approval
20. HL7 FHIR R4 export
21. Kiosk/session wipe and patient isolation
22. Robust DEMO MODE using synthetic data
23. Local hosting architecture
24. (OPTIONAL, LAST STAGE) Protected tunnel for remote demonstration.
    Never a core dependency; local demo must work without it.

AYUSH is ALSO Tier 1, but only as a controlled, thin, clinically
validated slice. See Section 15.

------------------------------------------------------------
TIER 2 — SHOULD / IMPORTANT AFTER THE CORE DEMO
------------------------------------------------------------

Implement after Tier 1 is stable:

1. Documentation confidence scoring
2. ICD-10 suggestions
3. Marathi voice/polish improvements
4. Audit logging
5. Better document provenance UI
6. More complete patient history fields
7. Expanded AYUSH assessment fields
8. Better offline synchronization
9. Basic clinic analytics
10. Additional synthetic evaluation cases

------------------------------------------------------------
TIER 3 — COULD / LATER
------------------------------------------------------------

Do NOT allow these features to delay the core SIH demo:

1. CPT expansion
2. Advanced analytics
3. Advanced triage dashboard
4. Team workspaces
5. Advanced RBAC
6. Real ABDM integration
7. Mobile/PWA production hardening
8. Large language/document model upgrades
9. District-scale deployment features
10. Commercial pricing implementation
11. Additional complaint/disease modules beyond the initial ten
12. Advanced billing/package-code workflows

If time is limited, complete Tier 1 before touching Tier 2 or Tier 3.

PRE-AGREED CUT ORDER (if deadline/capacity is insufficient):
Reduce breadth, NOT reliability. Cut in this order, top first:
  1. Ten complaint templates -> five (chest pain, fever, cough,
     abdominal pain, headache)
  2. Marathi voice -> Marathi touch-only (decided by the ASR gate)
  3. AYUSH slice -> Prakriti only
  4. Hindi voice -> Hindi touch-only
  5. Document types -> prescription + lab report only
NEVER cut: red-flag engine, deterministic safety checks, clinician
approval, session wipe/isolation, provenance, synthetic-data rule,
the vertical slice.

A partially implemented Tier 3 feature must NEVER break a completed
Tier 1 feature.

============================================================
1. SOURCE OF TRUTH
============================================================

The official MedScribeAI project presentation is the baseline for
the existing product.

Its six original objectives MUST remain part of the final product:

1. Automated SOAP Note Generation
2. Deterministic Clinical Safety Layer
3. Documentation Confidence Scoring
4. HL7 FHIR R4 Interoperability
5. Offline-First Operation
6. Automated Billing Support

However, scope the billing objective correctly:

- ICD-10 remains relevant to the SIH build.
- CPT is NOT an SIH-critical requirement.
- Do not make CPT part of the SIH MVP.
- If CPT already exists in the current repository, preserve it
  where safe, but place it behind a feature flag or leave it as a
  legacy/optional module.
- Do not spend MVP development time expanding CPT.
- For an India-focused billing story, research appropriate Indian
  healthcare/package-code mechanisms separately before implementing
  them. Do not invent package codes.

The existing technology baseline is:

Frontend:
- React
- Vite
- TypeScript
- Tailwind CSS

Backend:
- Express.js
- TypeScript

Existing AI:
- Gemini API
- @google/genai

Existing testing:
- Vitest
- React Testing Library
- GitHub Actions CI

Existing project features may include:
- SOAP workspace
- S/O/A/P tabs
- inline editing
- Read Aloud
- Copy for EHR
- Print Prescription
- FHIR Export
- Save Record
- Encounter History
- Search/filter
- Clinic Analytics
- Safety & Interaction Alerts
- ICD-10/CPT suggestions
- confidence scores
- offline NLP fallback
- synthetic clinical scenarios

DO NOT remove these merely because the new SIH workflow has a
different entry point.

============================================================
2. PROJECT GOVERNANCE AND EXISTING REPOSITORY RULES
============================================================

The repository may already contain governance/context files such as:

- phases.md
- todo.md
- memory.md
- rules.md
- README and other project-specific instructions

These files are part of the project's working context.

During the audit:
1. Locate all existing governance, phase, task, memory, and rules files.
2. Reconcile them with this master plan.
3. Identify conflicts instead of silently overwriting them.
4. Preserve useful existing project conventions.
5. Do not delete or replace governance files without approval.

At the end of EVERY implementation phase:

- update todo.md with completed, active, blocked, and next tasks
- update memory.md with important architectural/context decisions,
  discovered constraints, test results, and unresolved issues
- update phases.md when phase status changes
- update rules.md only when project rules genuinely change

If these files use a different structure, preserve their structure
rather than rewriting them.

This master prompt is the architectural source of truth, but the
repository's governance files remain the operational context for
continuing work across coding-agent sessions.

============================================================
3. SIH PRODUCT POSITIONING
============================================================

For the SIH presentation/demo, lead with the actual SIH problem.

The primary story is:

PATIENT INTAKE
→ CLINICAL HISTORY
→ DOCUMENT TIMELINE
→ RED-FLAG IDENTIFICATION
→ AYUSH/PRIMARY-CARE INTAKE
→ DOCTOR REVIEW
→ AI-ASSISTED DOCUMENTATION
→ SAFETY VERIFICATION
→ FHIR

Do NOT lead the SIH story with:
- pricing
- commercial billing
- CPT
- advanced analytics
- SaaS packaging
- SOAP generation alone

SOAP is an important downstream capability:

"The patient's structured case is prepared before consultation,
and MedScribeAI then helps the clinician produce and verify the
clinical documentation."

The commercial pricing direction from the original project may be
kept for the college/product presentation, but it is NOT the core
SIH value proposition.

============================================================
4. FINAL PRODUCT VISION
============================================================

MedScribeAI is an AI-assisted clinical intake and documentation
platform for high-volume primary-care and AYUSH-oriented healthcare
settings.

The patient-side system collects structured information before
consultation.

The doctor-side system uses that information during consultation
and documentation.

The system must follow:

AI DRAFTS.
RULES VERIFY.
PATIENT CONFIRMS.
DOCTOR DECIDES.
FHIR CONNECTS.

The product is NOT an autonomous medical diagnosis system.
It is NOT an uncontrolled patient chatbot.
It is NOT an autonomous prescribing system.

============================================================
5. CENTRAL ARCHITECTURE — CLINICALCASE
============================================================

The ClinicalCase is the central domain object.

It is the bridge between patient intake and existing MedScribeAI.

Conceptually:

ClinicalCase
├── Patient identity
├── Demographics
├── Language
├── Consent
├── Encounter
├── Chief complaint
├── HPI
├── Past medical history
├── Past surgical history
├── Medications
├── Allergies
├── Family history
├── Personal history
├── Review of systems
├── Investigations
├── Documents
├── Timeline
├── Red flags
├── AYUSH assessment
├── Consultation transcript
├── SOAP
├── Documentation score
├── Safety alerts
├── ICD-10 suggestions
├── Sources / provenance
├── Confidence
├── Clinician verification
├── Audit trail
└── FHIR representation

Do not create disconnected AI features.

Every major feature must either:
A. create data for ClinicalCase,
B. read from ClinicalCase, or
C. transform ClinicalCase into an output.

============================================================
6. COMPLETE USER FLOW
============================================================

The target end-to-end flow is:

PATIENT ARRIVES
↓
PATIENT INTAKE
↓
LANGUAGE
↓
CONSENT
↓
IDENTIFICATION
↓
CHIEF COMPLAINT
↓
CLINICAL INTERVIEW
↓
VOICE / TOUCH
↓
ADAPTIVE QUESTION GRAPH
↓
RED-FLAG CHECK
↓
DOCUMENT UPLOAD
↓
OCR / EXTRACTION
↓
TIMELINE
↓
PATIENT REVIEW
↓
PATIENT CONFIRMATION
↓
CLINICAL CASE
↓
DOCTOR QUEUE
↓
DOCTOR REVIEWS SUMMARY
↓
CONSULTATION
↓
DICTATION / AUDIO / TRANSCRIPT
↓
GEMINI OR OFFLINE DOCUMENTATION PATH
↓
STRUCTURED SOAP
↓
SAFETY CHECK
↓
OPTIONAL CONFIDENCE / ICD-10
↓
MANDATORY CLINICIAN REVIEW
↓
CLINICIAN APPROVAL
↓
FHIR R4
↓
PRINT / SAVE / HISTORY

============================================================
7. PATIENT INTAKE
============================================================

The patient interface must be:

- touch-friendly
- simple
- large-control
- low cognitive load
- accessible to elderly/non-technical users
- multilingual
- voice-capable
- usable on a kiosk/tablet-sized screen

Initial languages:
- English
- Hindi
- Marathi

Keep the architecture extensible for additional Indian languages.

Patient flow:

WELCOME
→ LANGUAGE
→ CONSENT
→ IDENTIFICATION
→ CHIEF COMPLAINT
→ CLINICAL HISTORY
→ DOCUMENTS
→ REVIEW
→ CONFIRM
→ SUBMIT

============================================================
8. CLOUD PROCESSING, CONSENT, AND LOCAL-ONLY MODE
============================================================

Live operation may send patient-provided information to external
services such as Gemini and Bhashini when those services are enabled.

This must be explicit.

Consent must distinguish, where applicable:

- clinical history collection
- audio/voice processing
- document processing
- local storage
- cloud AI processing
- interoperability/ABDM sharing

When cloud AI is active, the UI must clearly indicate:

"CLOUD AI PROCESSING ENABLED"

When local-only mode is enabled, the UI must indicate:

"LOCAL-ONLY MODE"

Local-only mode must prevent patient data from being sent to cloud
AI services.

The system must provide a configuration flag for local-only operation.

For any tunneled or publicly reachable demo:
- use synthetic data only
- never use real patient data
- show the demo/synthetic-data state clearly

Do not claim DPDP, HIPAA, ABDM, or other regulatory compliance merely
because these controls exist. Treat them as privacy/security design
measures unless formal compliance has been independently established.

============================================================
9. INITIAL COMPLAINT LIBRARY
============================================================

Tier 1 must include exactly these initial complaint templates:

1. Fever
2. Cough
3. Chest pain
4. Abdominal pain
5. Headache
6. Breathlessness
7. Vomiting/diarrhea
8. Joint pain
9. Urinary symptoms
10. Diabetes/hypertension follow-up

Do NOT attempt to model every disease.

Build an extensible question-template system so new complaints can
be added later without rewriting the engine.

Supported question types:

- Yes/No
- single choice
- multiple choice
- numeric scale
- date
- duration
- free text
- voice
- touch
- confirmation

============================================================
10. CLINICAL INTERVIEW ENGINE
============================================================

The LLM must NOT freely control the clinical interview.

Use:

CLINICAL ONTOLOGY
↓
QUESTION GRAPH
↓
DIALOGUE MANAGER
↓
PATIENT ANSWER
↓
AI EXTRACTION
↓
STRUCTURED FACT
↓
PATIENT CONFIRMATION
↓
NEXT QUESTION

The deterministic clinical engine controls:

- required fields
- question sequence
- branching
- completion
- red flags
- confirmation
- missing information

The LLM may assist with:

- language understanding
- extracting structured facts
- natural phrasing
- multilingual conversion
- summarization

The LLM must not silently invent clinical facts or decide what
clinical question must be asked outside the configured graph.

INTERVIEW LENGTH TARGET:
- Typical single-complaint case: under 8 minutes end to end
  (measured with real test users in the evaluation phase, not assumed)
- Confirmation policy: HIGH-RISK facts (red-flag-related symptoms,
  medications, allergies, durations used in rules) are confirmed
  individually. LOW-RISK facts may be confirmed in ONE batch summary
  screen at the end of a section.
- Record time-per-section and abandonment points for evaluation.

============================================================
11. VOICE / ASR STRATEGY
============================================================

Use a layered ASR strategy.

Preferred online path:
1. Bhashini / appropriate Indian-language speech service

Local fallback:
2. Whisper or another locally runnable ASR model where hardware
   permits

Browser fallback:
3. Web Speech API where available

IMPORTANT:
Web Speech API must not be described as guaranteed offline ASR.

If ASR is unavailable:
- provide manual touch/text input
- do not block the patient workflow
- preserve the answer as manually entered

Every voice-extracted clinical fact must be confirmed before it is
finalized.

MARATHI ASR DECISION GATE:
After the initial Bhashini/Whisper evaluation, make an explicit
decision:

IF Marathi ASR meets the team's measured demo threshold:
    Marathi may be used for the primary demo voice path.

IF Marathi ASR does NOT meet the threshold:
    - primary demo language becomes Hindi or English
    - Marathi remains available through touch/text
    - Marathi voice remains an experimental/limited path
    - document the measured limitation honestly

Do not let an untested or unreliable Marathi ASR path become a
single point of failure for the final demonstration.

Example:

Patient:
"मला तीन दिवसांपासून ताप आहे."

System:
"तुम्हाला तीन दिवसांपासून ताप आहे. बरोबर?"

YES / NO / EDIT

Only after confirmation:
Structured fact = fever, duration = 3 days.

TEST MARATHI ASR EARLY.

Do not assume Marathi speech accuracy. Measure it.

============================================================
12. RED-FLAG ENGINE
============================================================

Build a deterministic red-flag engine.

It is a triage-support mechanism, NOT a diagnostic engine.

Example:

Chest pain
+
Breathing difficulty
+
Severe sweating
=
HIGH PRIORITY

Safe wording:

"Your answers indicate symptoms that require prompt medical
assessment."

Do NOT output an unsupported diagnosis such as:
"You are having a heart attack."

The engine must:

- detect configured combinations
- assign priority
- record the triggering facts
- notify/flag the doctor or triage workflow
- continue according to a predefined safe workflow

The rules must be deterministic, testable and versioned.

CLINICAL REVIEW REQUIREMENT:
The following must be reviewed by an appropriately qualified clinician
before being treated as final demo clinical content:

- red-flag rules
- the ten complaint templates
- safety rules and their clinical wording
- high-priority alert messages

Preferably have an MBBS/appropriately qualified clinician review the
primary-care/red-flag/safety content.

For AYUSH-specific content, use an appropriate BAMS/Ayurveda reviewer.

The reviewer should also review representative phrasing variants in
English, Hindi, and Marathi where those languages are used.

Do not treat a test set written only by the student team as evidence
of clinical completeness.

The team may set a target of 100% recall on the defined synthetic
red-flag test set, but report this only as performance on that
reviewed test set—not as proof of clinical safety.

Document the reviewer, review date, scope, and any limitations.

============================================================
13. MEDICAL DOCUMENT INTELLIGENCE
============================================================

Patient can upload/capture:

- prescriptions
- laboratory reports
- discharge summaries
- previous case sheets
- diagnostic reports
- imaging reports

Pipeline:

IMAGE/DOCUMENT
↓
QUALITY CHECK
↓
PREPROCESSING
↓
OCR
↓
DOCUMENT CLASSIFICATION
↓
CLINICAL ENTITY EXTRACTION
↓
VALIDATION
↓
PATIENT REVIEW
↓
CLINICAL CASE
↓
TIMELINE

Document quality checks:

- blur
- lighting
- crop
- rotation
- readability

If quality is poor:
"Please retake the document image."

Extraction must never fabricate missing information.

Use:
"Not documented."

Do NOT convert missing information into:
"No history."

============================================================
14. OCR STACK
============================================================

Use a layered OCR strategy.

Preferred:
- Gemini vision/document capability when the online service is
  available and appropriate

Local fallback:
- Tesseract for locally processable documents

If OCR fails:
- allow manual entry
- retain the original document
- mark the extracted fields as unavailable/unverified

OCR is an extraction aid, not an authority.

All important extracted facts must retain provenance.

============================================================
15. AYUSH MODE — TIER 1
============================================================

AYUSH is a core SIH differentiator and must NOT be treated as an
optional late-stage feature.

However, implement a THIN, SAFE, CLINICALLY REVIEWED AYUSH slice.

Before writing the final AYUSH questions:

STOP and obtain review from an appropriate BAMS/Ayurveda subject
expert.

Do not wait until final deployment.

The first AYUSH slice should focus on a manageable subset, such as:

- Prakriti
- Agni
- selected relevant assessment fields

Additional fields may be added only after subject-expert review.

The original broader architecture may support:

- Prakriti
- Vikriti
- Sara
- Samhanana
- Pramana
- Satmya
- Sattva
- Ahara Shakti
- Vyayama Shakti
- Vaya
- Agni
- Koshtha
- Ahara-Vihara
- Nidana

But do NOT make all of these mandatory for the MVP unless the BAMS
reviewer validates the questions and the team has enough time.

AYUSH mode must:
- capture structured assessment information
- show it to the qualified clinician
- preserve provenance
- never autonomously prescribe treatment
- never claim clinical validation without evidence

============================================================
16. SOURCE / PROVENANCE
============================================================

Every important clinical fact should identify its origin.

Use explicit source types:

PATIENT_REPORTED
CLINICIAN_OBSERVED
DOCUMENT_EXTRACTED
AI_GENERATED
CLINICIAN_VERIFIED

Example:

Chief complaint:
"Chest pain for 2 days"

Source:
PATIENT_REPORTED / VOICE

Example:

HbA1c:
8.2%

Source:
DOCUMENT_EXTRACTED / LAB REPORT / PAGE 1

Example:

Medication:
Metformin 500 mg

Source:
DOCUMENT_EXTRACTED / PRESCRIPTION

Each fact should store where practical:

- source
- confidence
- timestamp
- extraction method
- verification state

This is a core anti-hallucination and clinician-trust mechanism.

============================================================
17. MEDICAL TIMELINE
============================================================

Build a chronological timeline from:

- patient history
- uploaded documents
- investigations
- medications
- diagnoses
- procedures
- relevant encounters

Example:

2024
- diagnosis

2025
- hospitalization
- investigation

2026
- prescription
- current complaint

The timeline is a core SIH demonstration feature.

============================================================
18. EXISTING MEDSCRIBEAI SOAP WORKFLOW
============================================================

DO NOT REMOVE OR REBUILD THE EXISTING SOAP workflow unless the
repository audit proves it is broken.

The existing flow remains:

DICTATION / AUDIO / TRANSCRIPT
↓
ONLINE GEMINI OR OFFLINE LOCAL NLP
↓
STRUCTURED SOAP

SOAP:
- Subjective
- Objective
- Assessment
- Plan

Preserve existing capabilities where present:

- Full SOAP view
- S/O/A/P tabs
- inline editing
- Read Aloud
- Copy for EHR
- Print Prescription
- Save Record
- FHIR Export
- Encounter History

The new ClinicalCase becomes an additional input source to the SOAP
workflow.

Do not replace doctor-side consultation with patient intake.

============================================================
19. GEMINI / LLM RULES
============================================================

Gemini remains the primary online LLM according to the existing
architecture.

LLM output must follow strict rules:

- extract facts only
- do not invent symptoms
- do not invent diagnoses
- do not invent medications
- do not invent allergies
- do not fabricate test results
- preserve uncertainty
- distinguish source types
- mark missing information
- return structured output
- follow the defined SOAP schema

The LLM produces a DRAFT.

The LLM is NOT the final clinical decision-maker.

============================================================
20. DETERMINISTIC SAFETY ENGINE
============================================================

Safety must be independent from the LLM.

Minimum safety rules:

1. Drug-drug interaction
2. Drug-condition interaction
3. Allergy conflict
4. Duplicate medication
5. Other explicitly configured rules

IMPORTANT COVERAGE LIMIT:
The repository's current interaction/safety dataset may be small.

Do not describe it as a complete drug-interaction database.

The UI and documentation must state the scope/source/version of the
rules or dataset actually used.

If a medication or interaction is outside the configured knowledge
base:
- do not claim "no interaction"
- return "Not covered by configured safety rules" or equivalent
- require clinician verification

Input:
structured clinical facts + medications + allergies + conditions

Output:
deterministic safety alerts

Each alert should contain:

- alert type
- severity
- involved medication/condition
- reason
- source/rule identifier
- "Requires Doctor Verification"

Never automatically:
- prescribe
- discontinue
- modify medication

The LLM must NEVER be the only safety mechanism.

============================================================
21. DOCUMENTATION CONFIDENCE — TIER 2
============================================================

Preserve the existing 0–100% documentation scoring system.

Provide:

- overall score
- Subjective score
- Objective score
- Assessment score
- Plan score
- missing-information checklist

Example:

Subjective: 94%
Objective: 88%
Assessment: 91%
Plan: 93%
Overall: 92%

This score is a completeness/support indicator.

It is NOT:
- diagnostic confidence
- clinical correctness
- a guarantee of safe care

============================================================
22. ICD-10 — TIER 2
============================================================

Keep ICD-10 suggestions.

For each suggestion provide:

- code
- description
- confidence
- rationale based only on documented information

Clinician verification is mandatory.

Do not allow AI-generated coding to silently become final.

CPT is NOT required for the SIH MVP.

If the existing repository already contains CPT:
- preserve it where practical
- do not make it a dependency of the SIH demo
- optionally hide it behind a feature flag
- do not expand its implementation during Tier 1

============================================================
23. DOCTOR CONSOLE
============================================================

The clinician should see a patient-ready summary before consultation.

Minimum Tier 1 view:

TODAY'S QUEUE
- Priority
- Ready
- Review
- Completed

Patient summary:
- demographics
- chief complaint
- structured history
- medications
- allergies
- documents
- timeline
- red flags
- AYUSH assessment where applicable

Then existing consultation tools:
- dictation
- transcript
- SOAP
- safety
- review
- approval

The SIH story should visibly show:

"Patient intake prepared the case before the doctor started
consultation."

============================================================
24. MANDATORY CLINICIAN REVIEW
============================================================

The clinician must be able to:

- edit
- accept
- reject
- correct
- add information
- verify
- approve

AI-generated information must NEVER silently become the final
clinical record.

Final state:
"Clinician Verified"

Where feasible store:
- original AI output
- edited output
- reviewer
- timestamp
- important changes

============================================================
25. FHIR R4 — TIER 1
============================================================

FHIR R4 is mandatory for the SIH demo.

Map ClinicalCase/Encounter/SOAP to appropriate FHIR resources.

Potential resources:

- Patient
- Encounter
- Condition
- Observation
- AllergyIntolerance
- MedicationStatement and/or MedicationRequest
- DiagnosticReport
- DocumentReference
- Composition

Generate:

ClinicalCase
↓
FHIR Mapper
↓
FHIR R4 Bundle
↓
Validation
↓
Export / adapter

If ABDM integration is not actually implemented:
- label the integration as MOCK/SANDBOX
- never present it as a live ABDM connection

============================================================
26. OFFLINE-FIRST — REALISTIC SCOPE
============================================================

Offline operation is required, but do NOT promise impossible
offline capabilities.

What MUST work offline:

- patient question graph
- deterministic rules
- touch interaction
- local structured intake
- local session state
- red-flag rules
- manual entry
- doctor-side existing offline fallback where already supported
- demo workflow

What may degrade when offline:

- cloud LLM
- cloud ASR
- cloud OCR

When cloud services are unavailable:

ASR:
→ local Whisper if feasible
→ otherwise manual input

OCR:
→ local Tesseract if feasible
→ otherwise manual entry

LLM:
→ existing local/browser NLP fallback
→ otherwise structured/manual workflow

Do NOT require offline OCR + offline ASR + offline LLM all to be
perfect before the MVP can run.

The patient workflow must degrade gracefully instead of failing.

============================================================
27. AI SERVICE ADAPTERS
============================================================

Create replaceable interfaces where practical:

IAssistantModel
ITranscriptionService
IOcrService
ITtsService

Initial implementations:

LLM:
- Gemini online
- existing local/browser fallback

ASR:
- Bhashini online
- Whisper local where feasible
- Web Speech API browser fallback

OCR:
- Gemini vision/document path online
- Tesseract local fallback

TTS:
- existing/browser-compatible TTS where available

Do not introduce unnecessary abstraction layers if the repository
already has an equivalent pattern.

============================================================
28. DATABASE / STORAGE
============================================================

The current repository must be audited first.

The observed/expected baseline may rely heavily on browser-local
storage and may not yet have authentication or a production
database. VERIFY this; do not assume.

For the unified local-hosted implementation:

Preferred database:
- SQLite

Use SQLite for structured clinical/application data unless the
repository audit identifies a strong reason to retain an existing
working persistence layer during the MVP.

Do not migrate storage just for architectural fashion.

Core conceptual entities:

- patients
- encounters
- consents
- sessions
- clinical_cases
- clinical_facts
- questions
- answers
- documents
- document_extractions
- medications
- allergies
- investigations
- timeline_events
- red_flags
- soap_notes
- safety_alerts
- documentation_scores
- billing_codes
- summaries
- users
- audit_logs

You do NOT need 21 fully production-grade tables before the demo.

Start with the minimum schema required by Tier 1 and evolve it.

============================================================
29. AUTH / SECURITY / PRIVACY
============================================================

The repository may not currently contain production authentication.
Treat this as new work if the audit confirms it.

Minimum Tier 1 security:

- patient session isolation
- kiosk reset
- temporary-data cleanup
- protected API boundaries
- basic clinician/admin access separation where required
- consent record
- MINIMAL audit events for important clinical actions
- secure document handling
- no real patient data in development/testing

Tier 1 audit events should be limited to critical actions such as:
- consent recorded
- patient session created/reset
- ClinicalCase submitted
- clinician approval
- FHIR export
- important safety alert acknowledgement

Full audit-history reporting and advanced audit analytics remain Tier 2.

Do not claim legal or regulatory certification unless actually
implemented and independently verified.

Kiosk requirement:

Patient A must NEVER see Patient B's information.

Do NOT rely on browser localStorage alone for patient isolation.

The kiosk must use:
- server-side persistence for clinical records
- authenticated/session-scoped APIs
- a dedicated kiosk route/interface
- API authorization that prevents kiosk sessions from calling
  clinician/admin APIs
- server-side session expiration/reset
- temporary-data cleanup
- ideally a separate browser profile/device context for kiosk use

If the kiosk and doctor console share a browser origin, assume their
browser storage may be shared. Never use shared localStorage as the
security boundary.

After each patient:
- clear UI state
- invalidate the kiosk session
- clear temporary patient data
- clear temporary audio when appropriate
- clear temporary image/document state
- reset the kiosk

Add a test proving:
Patient A session → reset → Patient B session
cannot retrieve Patient A data.

============================================================
30. LOCAL HOSTING + TUNNEL
============================================================

Primary deployment target:

LOCAL HOSTING.

The application should be capable of running on the team's local
machine / local clinic computer.

Development/demo architecture:

Browser/Kiosk
→ Local frontend
→ Local Express/TypeScript backend
→ SQLite
→ AI adapters

For remote demonstration only, add a tunnel as the FINAL deployment
stage.

Do not make the production architecture depend on a tunnel.

TUNNEL SECURITY:
- require access control such as basic authentication or a protected
  access gateway
- never expose an unauthenticated clinical application
- use synthetic data only while tunneled
- disable the tunnel when not needed
- do not expose real patient records through the tunnel
- document how the tunnel is enabled, protected, tested, and disabled

The tunnel is for:
- remote faculty review
- SIH demonstration
- temporary external access

Document clearly how the tunnel is enabled and disabled.

============================================================
31. DEMO MODE
============================================================

The demo must survive:

- internet failure
- Gemini API failure
- OCR failure
- ASR failure
- model quota failure

Provide:

LIVE MODE
and
DEMO MODE

DEMO MODE uses synthetic predefined cases.

It must still demonstrate the real application workflow and UI.

Never fake a clinical result.

Clearly label:
"SYNTHETIC / DEMO DATA"

The demo must never silently switch from a failed real service to a
fabricated clinical answer.

============================================================
32. PRIMARY DEMO SCENARIO
============================================================

Use one complete synthetic scenario.

Example:

Patient:
52-year-old synthetic patient

Language:
Marathi

Complaint:
Chest pain

History:
Hypertension

Medication:
Amlodipine

Previous documents:
Prescription + laboratory report

Flow:

1. Select Marathi
2. Give consent
3. Identify/register patient
4. State complaint
5. Answer adaptive questions
6. Use voice/touch
7. Red-flag engine evaluates
8. Upload previous prescription
9. OCR extracts medication
10. Upload lab report
11. Timeline is created
12. Patient reviews extracted/history information
13. Patient confirms
14. Doctor sees patient in queue
15. Doctor reviews the summary
16. Doctor conducts consultation
17. Doctor dictates
18. Gemini or offline path creates SOAP draft
19. Deterministic safety engine runs
20. Doctor reviews and edits
21. Doctor approves
22. FHIR R4 Bundle is generated
23. Prescription can be printed
24. Encounter is saved
25. History/analytics update

Do not use real patient data.

============================================================
33. EVALUATION METHODOLOGY
============================================================

Do not say "measure, don't invent" without defining how measurement
will happen.

Create a reproducible synthetic evaluation set.

Minimum target:

A. DOCUMENT SET
20 synthetic medical documents:
- prescriptions
- lab reports
- discharge summaries
- diagnostic/imaging-style reports

Measure:
- OCR field accuracy
- extraction accuracy
- missing-field handling
- provenance correctness

B. INTERVIEW SET
10 scripted synthetic interview scenarios covering:
- normal case
- red-flag case
- missing information
- contradictory answers
- multilingual input
- offline mode
- medication/allergy information

Measure:
- required-field completion
- question branching correctness
- confirmation correctness
- structured fact extraction

C. RED-FLAG SET
Create a deterministic test list containing:
- positive red-flag scenarios
- negative scenarios
- boundary/combination scenarios

Initial target:
100% recall on the project's defined red-flag test set.

Report false positives separately.

Do NOT claim 100% clinical safety.
The target applies only to the defined synthetic rule-test set.

D. MARATHI ASR
Test Bhashini/Whisper/browser paths on representative synthetic
Marathi utterances.

Measure:
- transcription correctness
- clinical entity extraction correctness
- confirmation correction rate

If accuracy is insufficient:
- do not hide the limitation
- strengthen touch/manual fallback
- report the measured limitation

============================================================
34. SYNTHETIC TEST DATA
============================================================

Use synthetic data only.

Preserve the existing synthetic clinical scenarios.

Add:

1. Normal case
2. Red-flag case
3. Medication interaction case
4. Allergy conflict case
5. Missing information case
6. OCR extraction case
7. Multilingual case
8. Offline case
9. Contradictory-answer case
10. FHIR case

Never use real patient data in development or testing.

============================================================
35. TESTING
============================================================

Unit tests:

- question graph
- branching
- confirmation
- red flags
- safety rules
- FHIR mapping
- session cleanup
- provenance
- ClinicalCase validation

Integration tests:

Patient
→ Intake
→ ClinicalCase

Document
→ OCR
→ Extraction
→ Timeline

ClinicalCase
→ Doctor
→ SOAP

SOAP
→ Safety
→ Optional confidence
→ ICD-10
→ FHIR

E2E:
Complete patient-to-doctor journey.

Security:
- Patient A cannot access Patient B
- expired session cannot reopen
- unauthorized request cannot access protected record
- kiosk resets correctly

============================================================
36. EXISTING FEATURES THAT MUST NOT BE LOST
============================================================

Preserve existing working functionality including, where currently
implemented:

- Gemini clinical reasoning
- SOAP generation
- anti-hallucination prompts
- deterministic safety
- drug interaction checking
- allergy checking
- documentation scoring
- missing-information flags
- ICD-10
- existing CPT functionality, if present
- confidence scores
- billing rationale
- FHIR R4
- offline NLP
- clinician review
- prescription printing
- Read Aloud
- Copy for EHR
- encounter history
- analytics
- multilingual support
- React/Vite
- Express/TypeScript
- Vitest
- React Testing Library
- GitHub Actions CI
- synthetic clinical scenarios

Do not delete a feature merely because it is Tier 2 or Tier 3.
Instead, preserve it while preventing it from blocking the Tier 1
implementation.

============================================================
37. WHAT NOT TO DO
============================================================

DO NOT:

- delete the current MedScribeAI implementation
- replace the doctor workflow with patient intake
- remove SOAP
- remove Gemini
- remove offline fallback
- make the LLM the safety engine
- allow autonomous diagnosis
- allow autonomous prescription
- fabricate missing information
- treat AI confidence as clinical certainty
- claim real ABDM when only mock/sandbox exists
- claim clinical validation without evidence
- invent evaluation metrics
- use real patient data
- hard-code the application to one patient
- build an uncontrolled medical chatbot
- make CPT mandatory for SIH MVP
- build all future roadmap items before stabilizing the MVP
- add unnecessary dependencies
- perform a repository-wide rewrite without approval
- silently change existing behavior

============================================================
38. REPOSITORY AUDIT — FIRST ACTION
============================================================

DO NOT START CODING.

The first task is an audit.

Inspect the complete repository and identify:

1. frontend structure
2. backend structure
3. routing
4. Gemini integration
5. SOAP schema
6. safety engine
7. ICD-10/CPT logic
8. FHIR module
9. offline NLP
10. storage/database
11. localStorage usage
12. authentication, if any
13. authorization boundaries
14. kiosk/doctor route separation
15. history/analytics
16. current tests
17. reusable UI components
18. existing synthetic data
19. current deployment/run commands
20. current dependencies
21. current document/voice functionality, if any

Produce:

A. ARCHITECTURE MAP

B. GAP ANALYSIS

Columns:
- Feature
- Existing status
- Current location
- Tier
- Reuse / Modify / New
- Dependencies
- Risk
- Test status

C. FILE CHANGE PLAN

Columns:
- File
- Action
- Reason
- Existing behavior affected?
- Test required?

D. MVP RISK LIST

Identify:
- blockers
- unknowns
- external-service dependencies
- hardware limitations
- Marathi ASR risks
- OCR risks
- offline limitations
- security gaps
- cloud-processing/privacy risks
- tunnel exposure risks
- ASR/OCR service dependency
- AYUSH validation dependency
- clinician-review dependency

STOP after the audit.

Do not perform destructive refactoring or large feature implementation
until the team reviews and approves the gap analysis and file-change
plan.

============================================================
39. DEVELOPMENT BUDGET / CHANGE CONTROL
============================================================

The agent must work in small phases.

Default budget per implementation phase:

- maximum 10 newly created/majorly modified CODE files
- maximum 2 new runtime dependencies
- maximum 1 architectural change

The file budget does NOT count:
- locale JSON
- question-template/configuration files
- red-flag rule data
- synthetic test fixtures
- static content/data files
- generated lockfile changes caused by an approved dependency

If a phase requires more than 10 CODE files:
STOP and explain why.

A phase may exceed the budget only with explicit team approval.

No new dependency may be added without:

1. purpose
2. alternatives considered
3. bundle/runtime impact
4. offline implications
5. license consideration
6. reason the existing stack cannot solve it

Do not add libraries for convenience if native/existing code can
perform the task adequately.

============================================================
40. DOCUMENTATION CONTROL
============================================================

Do NOT create a large documentation bureaucracy.

Maintain only these six core documents:

docs/PROJECT_MASTER_PLAN.md
docs/ARCHITECTURE.md
docs/CLINICAL_SPEC.md
docs/SAFETY_AND_PRIVACY.md
docs/API_SPEC.md
docs/TEST_PLAN.md

Add other documentation only when there is a real maintenance need.

The documents must remain synchronized with implementation.

============================================================
41. PARALLEL HUMAN / EXTERNAL DEPENDENCY TRACK
============================================================

Start these activities on Day 1. Do not wait until the corresponding
coding phase.

A. BAMS / AYUSH REVIEWER
- identify an appropriate BAMS/Ayurveda subject expert
- agree on the thin AYUSH scope
- review questions before implementation
- document reviewer feedback

B. PRIMARY-CARE CLINICAL REVIEWER
- identify an MBBS or appropriately qualified clinician
- review the ten complaint templates
- review red-flag rules
- review safety wording/rules
- review representative multilingual phrasing

C. BHASHINI / ASR ACCESS
- verify required registration/API access
- test Marathi early
- test Hindi/English as fallback candidates
- document quotas, latency, and limitations

D. ABDM / INTEROPERABILITY
- begin registration/access discussions if real integration is planned
- determine what can actually be demonstrated
- keep mock/sandbox integration clearly labelled until verified

E. INFRASTRUCTURE
- confirm local hosting machine
- confirm tunnel provider/access-control method
- confirm synthetic demo dataset
- confirm network-failure test environment

These are dependency tracks, not reasons to block the entire project.
The team should continue independent development while waiting,
using mock/synthetic adapters where necessary.

============================================================
42. IMPLEMENTATION PHASES
============================================================

PHASE 0 — AUDIT
- repository inspection
- architecture map
- gap analysis
- risk list
- file-change plan
- STOP FOR APPROVAL

PHASE 1 — FOUNDATION
- ClinicalCase schema
- minimal SQLite persistence
- API contracts
- SECURITY SKELETON (do NOT defer to Phase 13): session-scoped kiosk
  tokens, separate kiosk and clinician API namespaces, clinician login,
  server-side session expiry/reset
- provenance model

PHASE 1.5 — VERTICAL-SLICE MVP — MANDATORY
Do NOT continue horizontally until one complete slice works.

Build only:

Complaint:
- Chest pain

Language:
- English

Patient input:
- typed input OR mock/known voice input

Document:
- one synthetic prescription image

Flow:
Patient
→ consent
→ identification
→ chest-pain questions
→ red-flag evaluation
→ one prescription upload
→ OCR/manual extraction
→ ClinicalCase
→ doctor summary
→ existing SOAP
→ safety
→ clinician review/approval
→ FHIR R4

The slice must run end-to-end before widening scope.

Acceptance test:
A fresh synthetic patient can complete the full slice locally
without manual database manipulation.

SECURITY ACCEPTANCE (part of the same slice):
- a kiosk token cannot call any clinician API
- Patient A session -> reset -> Patient B session cannot retrieve
  Patient A data
- clinician APIs reject unauthenticated requests
Phase 13 hardens and extends this; it must not introduce it.

This is the project's first "working demo" milestone.

If the project deadline becomes constrained, this vertical slice
takes priority over breadth.

PHASE 2 — PATIENT MVP
- patient UI shell
- language
- consent
- identification
- ten complaint templates
- touch interaction

PHASE 3 — INTERVIEW
- deterministic question graph
- branching
- confirmation
- structured facts

PHASE 4 — VOICE
- Bhashini
- Whisper fallback where feasible
- Web Speech fallback
- manual fallback
- Marathi testing

PHASE 5 — SAFETY / TRIAGE
- red-flag rules
- queue priority
- deterministic tests

PHASE 6 — DOCUMENTS
- upload/capture
- quality checks
- OCR
- extraction
- provenance
- timeline
- patient review

PHASE 7 — AYUSH
- BAMS review first
- thin validated AYUSH slice
- integrate into ClinicalCase

PHASE 8 — DOCTOR INTEGRATION
- patient-ready summary
- queue
- ClinicalCase → existing doctor workflow

PHASE 9 — SOAP
- preserve existing SOAP
- connect ClinicalCase
- online Gemini / offline fallback

PHASE 10 — SAFETY
- preserve/integrate existing deterministic safety
- verify independently from LLM

PHASE 11 — FHIR
- ClinicalCase mapping
- FHIR R4 Bundle
- validation
- clearly labelled mock/sandbox adapter if needed

PHASE 12 — TIER 2
- documentation confidence
- ICD-10
- audit log
- Marathi polish
- basic analytics

PHASE 13 — SECURITY / HARDENING
- session isolation
- cleanup
- access controls
- consent records
- audit events

PHASE 14 — EVALUATION
- 20-document set
- 10 interview scenarios
- red-flag test set
- Marathi ASR test
- end-to-end test

PHASE 15 — LOCAL DEPLOYMENT
- local hosting
- setup script/documentation
- synthetic demo dataset
- failure recovery

PHASE 16 — REMOTE DEMO
- tunnel as final optional stage
- test remote access
- ensure tunnel is not a core dependency

PHASE 17 — DEMO HARDENING
- primary scenario
- offline failure test
- API failure test
- OCR/ASR failure test
- session reset test
- final SIH walkthrough

INTEGRATION RULE:
Every phase after the vertical slice must preserve a runnable
end-to-end path.

At the end of each phase:
1. run the vertical-slice regression
2. run the phase-specific tests
3. update todo.md
4. update memory.md
5. record blockers/risks
6. keep the demo runnable

Never allow the repository to reach a state where all modules are
individually developed but no end-to-end workflow works.

============================================================
43. IMPLEMENTATION ORDER
============================================================

Follow this order:

1. Audit repository
2. Produce gap analysis
3. STOP FOR APPROVAL
4. Preserve working features
5. Define ClinicalCase
6. Define provenance
7. Define minimal SQLite model
8. Define API contracts
9. Build the chest-pain English vertical slice
10. Prove the vertical slice works end-to-end
11. Add ten complaint templates
12. Add Hindi/Marathi language support
13. Add touch flow
14. Add voice adapters
15. Run Marathi ASR decision gate
16. Add red flags
17. Add documents/OCR
18. Add timeline
19. Add patient confirmation
20. Connect ClinicalCase to doctor console
21. Integrate existing SOAP
22. Integrate existing safety
23. Integrate FHIR
24. Add Tier 2 features
25. Harden security
26. Run clinician-reviewed evaluation
27. Local deployment
28. Protected tunnel
29. Demo hardening

Every stage must preserve the runnable vertical slice.============================================================
44. DEFINITION OF DONE — TIER 1
============================================================

Tier 1 is complete only when this works reliably.

VERTICAL-SLICE ACCEPTANCE MUST ALREADY HAVE PASSED:

Chest pain
→ English
→ typed/mock voice
→ one prescription
→ ClinicalCase
→ doctor summary
→ SOAP
→ safety
→ clinician approval
→ FHIR

Then the widened Tier 1 flow must work:

PATIENT
→ Language
→ Consent
→ Identification
→ Complaint
→ Ten-template clinical interview
→ Touch
→ Tested voice path
→ Adaptive question graph
→ Red-flag check
→ Document upload
→ OCR or safe manual fallback
→ Structured extraction
→ Timeline
→ Patient confirmation
→ ClinicalCase
→ Doctor queue
→ Doctor summary
→ Consultation
→ Existing SOAP
→ Deterministic safety
→ Clinician review
→ Clinician approval
→ FHIR R4
→ Print/Save/History
→ Session wipe

AND:

- no critical existing feature was lost
- safety works independently
- offline patient intake core works
- service failures degrade safely
- synthetic demo works
- FHIR export works
- clinician approval is mandatory
- patient sessions are isolated
- missing information is never hallucinated
- AYUSH thin slice is subject-expert reviewed
- local hosting works
- remote tunnel works only as an optional final demo layer

============================================================
45. DEFINITION OF DONE — TIER 2
============================================================

After Tier 1 is stable:

- documentation confidence works
- ICD-10 suggestions work
- audit logs work
- Marathi experience is improved based on test results
- provenance is visible to clinician
- basic analytics work
- additional synthetic evaluation is complete

============================================================
46. TIER 3 GATE
============================================================

Do not implement Tier 3 merely because the architecture supports it.

Tier 3 requires:

- Tier 1 stable
- Tier 2 stable
- no critical demo regressions
- available development time
- explicit team approval

CPT, advanced analytics, team workspaces, real ABDM integration and
commercial features are NOT allowed to delay the SIH MVP.

============================================================
47. PRODUCT / BUSINESS POSITIONING
============================================================

For the college/product presentation, the original product direction
may remain:

- affordable
- offline-first
- safety-focused
- FHIR-ready
- rural/Bharat healthcare oriented

Existing pricing direction may be preserved:

Free
- individual health workers

₹199/month
- small independent clinics

₹499/month
- multi-provider health centers

These prices are product/business-plan assumptions, not SIH evidence.

Do not make pricing a central SIH demo message.

============================================================
48. FUTURE ROADMAP
============================================================

Keep future architecture ready for:

Q1:
- landing page
- live database/API improvements
- expanded languages

Q2:
- ABDM registration/integration
- clinic pilot
- mobile/PWA

Q3:
- advanced RBAC
- team workspaces
- advanced analytics

Q4+:
- district rollout
- deeper clinical validation
- deeper ABDM integration

These are future capabilities, not Tier 1 requirements.

============================================================
49. FINAL ARCHITECTURE
============================================================

                         MEDSCRIBEAI
                              |
              +---------------+---------------+
              |                               |
              ▼                               ▼
       PATIENT INTAKE                   DOCTOR CONSOLE
              |                               |
       Language / Consent              Consultation
       Voice / Touch                   Dictation
       Clinical History                Transcript
       Documents                       Existing SOAP
       OCR                             Safety
       Timeline                        Review
       Red Flags                       Approval
       AYUSH
              |                               |
              +---------------+---------------+
                              |
                              ▼
                       CLINICAL CASE
                              |
                 +------------+------------+
                 |                         |
                 ▼                         ▼
          AI / DOCUMENTATION        DETERMINISTIC RULES
          Gemini / Offline NLP      Red Flags / Safety
                 |                         |
                 ▼                         |
             SOAP DRAFT                    |
                 |                         |
                 +------------+------------+
                              |
                              ▼
                       CLINICIAN REVIEW
                              |
                              ▼
                       CLINICIAN APPROVAL
                              |
             +----------------+----------------+
             |                |                |
             ▼                ▼                ▼
          FHIR R4         PRINT / SAVE      HISTORY
                              |
                              ▼
                       OPTIONAL ADAPTER
                        HIS / ABDM

============================================================
50. GOLDEN PRINCIPLE
============================================================

Always maintain:

AI DRAFTS.
RULES VERIFY.
PATIENT CONFIRMS.
DOCTOR DECIDES.
FHIR CONNECTS.

Never reverse these responsibilities.

============================================================
51. HOW TO USE THIS MASTER PROMPT
============================================================

Do NOT paste this entire document into every coding-agent request.

This file should be stored in the repository as the persistent
project-rules/master-plan document, for example:

- rules.md
or
- CLAUDE.md

Use the repository's existing rules.md if one already exists, after
reconciling it with this plan.

For each implementation phase, give the coding agent a SHORT task
prompt containing:
- the phase number
- the exact objective
- the acceptance criteria
- the files/modules allowed to change
- the tests required
- the current blockers

The agent must read the master rules file first.

FIRST AGENT TASK:
Give the agent ONLY the audit task:

"Read the project rules/master plan first. Inspect the complete
repository. Produce the architecture map, existing feature inventory,
SIH mapping, Tier 1/2/3 gap analysis, file-change plan, dependency
list, and risk register. Do not modify application code. Stop for
approval."

After approval, issue one phase-specific task at a time.

This prevents context drift and prevents the agent from attempting
the entire project in one response.

============================================================
52. FINAL ROLE OF THE CODING AGENT
============================================================

You are not being asked to blindly execute every line immediately.

Your responsibility is to:

1. inspect
2. compare
3. identify gaps
4. propose
5. get approval
6. implement in small phases
7. test
8. measure
9. preserve working functionality
10. document important decisions

For every feature report:

WHAT
WHY
WHERE
HOW
DEPENDENCIES
TESTS
RISK
IMPACT ON EXISTING FEATURES
TIER

Never silently remove functionality.

============================================================
53. STARTING TASK
============================================================

START NOW WITH AUDIT ONLY.

Do NOT modify production/application code yet.

Read the repository's master rules/governance files first.

Do NOT assume that this master prompt replaces:
- phases.md
- todo.md
- memory.md
- rules.md

Reconcile them during the audit.

Produce:

1. Repository architecture map
2. Existing feature inventory
3. SIH requirement mapping
4. Tier 1 / Tier 2 / Tier 3 mapping
5. ClinicalCase gap analysis
6. Data/storage gap analysis
7. ASR gap and Marathi-risk analysis
8. OCR/document gap analysis
9. AYUSH validation dependency
10. Safety-engine gap analysis
11. FHIR gap analysis
12. Security/session-isolation gap analysis
13. Local-hosting/deployment gap analysis
14. Evaluation readiness analysis
15. File-by-file proposed change list
16. New dependency list, if any
17. Risk register
18. Estimated implementation order

Then STOP.

WAIT FOR TEAM APPROVAL.

Do not perform destructive refactoring.
Do not replace the architecture.
Do not create a large number of files.
Do not install unnecessary dependencies.
Do not begin Tier 2 or Tier 3.

============================================================
54. FINAL OBJECTIVE
============================================================

Build ONE coherent MedScribeAI platform that combines:

PATIENT INTAKE
+
CLINICAL HISTORY
+
DOCUMENT INTELLIGENCE
+
RED-FLAG TRIAGE
+
AYUSH INTAKE
+
DOCTOR CONSULTATION
+
AI SOAP
+
DETERMINISTIC SAFETY
+
DOCUMENTATION CONFIDENCE
+
ICD-10
+
OFFLINE-FIRST CORE
+
FHIR R4
+
CLINICIAN REVIEW
+
PRESCRIPTION / SAVE
+
ENCOUNTER HISTORY
+
BASIC ANALYTICS
+
PRIVACY / CONSENT

without destroying the existing MedScribeAI implementation.

The first milestone is NOT "build everything."

Before approving Tier 1 breadth, the team lead must record:

- team size
- available development hours/week
- SIH/demo deadline
- availability of BAMS reviewer
- availability of clinician reviewer
- ASR/API access status

If the deadline or team capacity is insufficient:
reduce breadth, NOT reliability.

The first milestone is:

AUDIT → GAP ANALYSIS → APPROVAL → VERTICAL SLICE → TIER 1 MVP
→ TEST → DEMO.

The final SIH story is:

PATIENT TELLS THE SYSTEM
→ SYSTEM STRUCTURES THE HISTORY
→ SYSTEM CHECKS DEFINED RED FLAGS
→ SYSTEM READS PREVIOUS DOCUMENTS
→ PATIENT CONFIRMS THE INFORMATION
→ DOCTOR GETS A READY CLINICAL CASE
→ MEDSCRIBEAI DRAFTS THE SOAP
→ RULES INDEPENDENTLY CHECK SAFETY
→ DOCTOR REVIEWS AND DECIDES
→ FHIR CONNECTS THE RECORD.

That is the unified MedScribeAI architecture.
```
