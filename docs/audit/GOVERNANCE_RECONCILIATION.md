# MedScribeAI — Governance Reconciliation Plan (Phase 0 Audit)

**Inspection Date:** 2026-10-03  
**Auditor:** Lead Software & Healthcare Architect (Antigravity Agent)  
**Specification Reference:** `docs/MASTER_PROMPT.md` (Section 2: Project Governance; Section 38: Repository Audit)

---

## 1. Principles of Governance Reconciliation

Per Section 2 of `docs/MASTER_PROMPT.md`:
1. **Preserve useful existing conventions.**
2. **Never silently overwrite, delete, or rewrite existing governance files.**
3. **The Master Prompt is the architectural source of truth, while repository governance files (`phases.md`, `todo.md`, `memory.md`, `rules.md`, `prd.md`, `architecture.md`) remain the operational context across development sessions.**
4. **Append chronologically to `memory.md`; never overwrite past entries.**

---

## 2. File-by-File Reconciliation Analysis

### 2.1 `phases.md`
- **Current State:** Contains Phases 0 through 5 for "MedScribe Lite" startup polishing, component refactoring, marketing landing page, commercial pricing (₹0 / ₹199 / ₹499), Spanish internationalization, and resilience testing (dated July 2026).
- **Master Prompt Alignment:** Defines a new SIH 2026 PS 26047 redevelopment trajectory: Phase 0 (Audit), Phase 1 (Foundation & Security Skeleton), Phase 1.5 (Chest-Pain English Vertical Slice), Phase 2 (Patient MVP & 10 Templates), Phase 3 (Interview & Red Flags), Phase 4 (Integration & Hardening).
- **Conflict:** Overlapping phase numbering (e.g. existing Phase 1 vs new Phase 1).
- **Reconciliation Proposal:**
  - Retain existing Phases 0–5 under a clear heading: `## Sprint 1: MedScribe Lite Baseline (Completed July 2026)`.
  - Append the new roadmap under: `## Sprint 2: SIH 2026 PS 26047 Redevelopment (Phases 0 through 4)`.
  - **Zero content deleted or overwritten.**

### 2.2 `todo.md`
- **Current State:** Tracks 69 lines of tasks from the July 2026 sprint, with all items checked except visual screenshot generation.
- **Master Prompt Alignment:** Requires tracking active, blocked, and upcoming tasks for the SIH redevelopment phases.
- **Conflict:** Outdated task list reflecting previous sprint completion.
- **Reconciliation Proposal:**
  - Preserve the existing completed checklist under a section: `### Completed Baseline (Sprint 1)`.
  - Add a new active tracker section: `### Active Track: SIH 2026 Redevelopment (Sprint 2)`.
  - List Phase 0 Audit tasks as Completed/Reviewable, and list Phase 1 Foundation tasks as Pending Team Approval.

### 2.3 `memory.md`
- **Current State:** Running chronological engineering log spanning lines 1 to 258. It opens with the mandatory rule: *"NEVER edit or overwrite past entries."*
- **Master Prompt Alignment:** Requires recording architectural decisions, discovered constraints, test results, and unresolved issues at the end of each phase.
- **Conflict:** None. Both documents share the exact same append-only philosophy.
- **Reconciliation Proposal:**
  - Strictly preserve lines 1–258 without modification.
  - When Phase 0 is approved, append a new entry: `## Session Log: 2026-10-03 — Phase 0 Repository Audit Completed` summarizing audit findings, test baseline verification (46/46 passing), and Phase 1 readiness.

### 2.4 `rules.md`
- **Current State:** Defines 5 non-negotiable hard constraints:
  1. No Clinical Fabrication
  2. Physician Review Gate Preservation
  3. No Environment Secret Commits
  4. No Direct `node_modules` Modification
  5. Schema Change Safeguard (`src/types.ts` edits require explicit user approval).
- **Master Prompt Alignment:** Introduces the Golden Principle (*"AI DRAFTS. RULES VERIFY. PATIENT CONFIRMS. DOCTOR DECIDES. FHIR CONNECTS"*), strict synthetic data rules, session isolation rules, and the Phase Budget rule (max 10 code files, 2 runtime deps, 1 architectural change).
- **Conflict:** None. The Master Prompt rules directly strengthen the existing constraints.
- **Reconciliation Proposal:**
  - Preserve Sections 1 (Hard Constraints) and 2 (Commit Message Conventions) as written.
  - Propose appending `## 3. SIH Scope & Safety Rules` adding the Golden Principle, Phase Budget limits, and the strict Patient Session Isolation constraint.

### 2.5 `prd.md`
- **Current State:** Emphasizes commercial positioning for small independent clinics, a 3-tier SaaS pricing model ($19 / $49), a marketing landing page, and US-centric CPT billing.
- **Master Prompt Alignment:** The SIH 2026 PS 26047 core story must lead with: *Patient Intake → Clinical History → Document Timeline → Red Flags → AYUSH Slice → Doctor Review → SOAP → Safety Verification → FHIR*. It explicitly forbids leading the SIH presentation with pricing, commercial SaaS, or CPT.
- **Conflict:** Commercial SaaS product focus vs SIH rural primary care clinical intake focus.
- **Reconciliation Proposal:**
  - Add an introductory section to `prd.md`: `## 0. SIH 2026 PS 26047 Primary Mission & Scope Control`.
  - Designate the SIH Rural Healthcare Clinical Assistant as the Primary Focus.
  - Retain the existing commercial pricing and SaaS tiers under a distinct section labeled `## Legacy Commercial Product Track (Tertiary / College Presentation Only)`.

### 2.6 `architecture.md`
- **Current State:** Outdated regarding internal component structure: claims `SOAPNoteView.tsx` is 772 lines and that 0 tests exist (written during initial Phase 0 before Phase 2 refactored the component into `src/components/soap-note/` and established 46 passing tests).
- **Master Prompt Alignment:** Requires `ClinicalCase` domain model, SQLite persistence, and separate Kiosk vs Doctor API namespaces.
- **Conflict:** Stale code metrics in `architecture.md`.
- **Reconciliation Proposal:**
  - Keep Section 1 as historical record of original repo state.
  - Append `## 4. Current Architecture Baseline (2026-10-03 Audit)` accurately documenting the 46 passing Vitest tests and modular `soap-note/` structure.
  - Append `## 5. Planned SIH Target Architecture (Phase 1+)` depicting the SQLite engine, session isolation, and `ClinicalCase` bridge.

---

## 3. Summary of Governance Action Items

| Governance File | Planned Action | Conflict Resolution | Overwrites Allowed? |
| :--- | :--- | :--- | :--- |
| `phases.md` | Append Sprint 2 (Phases 0–4) | Numbering disambiguated via Sprints | **NO** |
| `todo.md` | Append SIH Phase 0/1 checklists | Historical items kept under Baseline | **NO** |
| `memory.md` | Append 2026-10-03 session log | Strictly append-only | **NO** |
| `rules.md` | Append Section 3 (SIH Rules) | Extends existing 5 constraints | **NO** |
| `prd.md` | Prepend SIH 26047 Mission | Re-scopes commercial pricing to tertiary | **NO** |
| `architecture.md` | Append Baseline update & target arch | Fixes stale metrics without erasing history | **NO** |
