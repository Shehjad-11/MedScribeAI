# MedScribeAI — Agent Rules (read first, every session)

Full reference: docs/MASTER_PROMPT.md (read ONLY the sections for the current phase).
Operational context: todo.md, memory.md, phases.md, rules.md (update at end of every phase).

## Golden principle
AI DRAFTS. RULES VERIFY. PATIENT CONFIRMS. DOCTOR DECIDES. FHIR CONNECTS.

## What this is
One unified platform: patient intake -> ClinicalCase -> doctor consultation -> existing SOAP -> deterministic safety -> clinician approval -> FHIR R4.
SIH PS 26047 story leads: intake, history, document timeline, red flags, AYUSH slice, doctor-ready case.

## Tiers
- Tier 1 MUST (SIH demo). Tier 2 SHOULD (after Tier 1 stable). Tier 3 COULD (needs explicit approval).
- Cut order if short on time: complaints 10->5, Marathi voice->touch-only, AYUSH->Prakriti only, Hindi voice->touch-only, docs->prescription+lab. Never cut: red flags, safety checks, clinician approval, session isolation, provenance, vertical slice.

## Never
- Delete/replace existing working features; rewrite repo-wide without approval; add a dependency without justification.
- Let the LLM be the safety layer, diagnose, prescribe, or invent missing facts ("Not documented" instead).
- Claim real ABDM / DPDP compliance / clinical validation / "no interaction" when only mock or out-of-dataset.
- Use real patient data, anywhere, ever. Synthetic only. Tunnel = synthetic only + access control.
- Trust localStorage as a security boundary.
- Start Tier 2/3 before Tier 1 is stable. Break the runnable vertical slice.

## Phase budget (default)
Max 10 new/majorly-modified CODE files, 2 new runtime deps, 1 architectural change per phase (config/locale/fixtures exempt). Exceeding it: STOP and explain.

## Workflow
Audit first -> STOP for approval -> Phase 1 (incl. security skeleton) -> Phase 1.5 vertical slice (chest pain, English, typed input, one prescription) -> widen. Report each feature as: WHAT / WHY / WHERE / HOW / DEPENDENCIES / TESTS / RISK / IMPACT / TIER.
