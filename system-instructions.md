# System Instructions — The AI's Constitution

> **Operating Rules & System Governance for MedScribe Lite**  
> *Permanently in force across all AI development sessions.*

---

## 1. Locked Technology Stack

The technology stack is strictly locked based on `package.json` analysis:

### Core Dependencies
- `@google/genai`: `^2.4.0`
- `@tailwindcss/vite`: `^4.1.14`
- `@vitejs/plugin-react`: `^5.0.4`
- `lucide-react`: `^0.546.0`
- `react`: `^19.0.1`
- `react-dom`: `^19.0.1`
- `vite`: `^6.2.3`
- `express`: `^4.21.2`
- `dotenv`: `^17.2.3`
- `motion`: `^12.23.24`

### Development Dependencies
- `@types/node`: `^22.14.0`
- `@types/express`: `^4.17.21`
- `autoprefixer`: `^10.4.21`
- `esbuild`: `^0.25.0`
- `tailwindcss`: `^4.1.14`
- `tsx`: `^4.21.0`
- `typescript`: `~5.8.2`
- `vite`: `^6.2.3`

---

## 2. Mandatory Operational Rules

### Rule A: Strict Dependency Management
- **Never add, remove, or upgrade** any package dependency or devDependency without explicit user instructions.
- All modifications to `package.json` must be requested directly by the user and documented in `dependency-lockbase.md` and `memory.md`.

### Rule B: Minimal & Targeted Code Changes
- **Never rewrite an entire file** when a targeted block edit or diff can achieve the result.
- Preserve existing comments, structure, and unrelated logic.

### Rule C: Session Lifecycle Discipline
- **Session Start:** Every AI development session MUST begin by reading `todo.md`, `memory.md`, and `rules.md`.
- **Session End:** Every AI development session MUST end by updating `todo.md` (task status) and `memory.md` (dated log of changes).

### Rule D: Clinical Safety & Language Guardrails
- **Physician Review Required:** UI text, alerts, prescriptions, and documentation MUST ALWAYS enforce "physician review required" or "attending physician approval needed" framing.
- **No Autonomous Diagnosis:** The AI must NEVER suggest or imply that it acts as an autonomous diagnostic authority or replaces clinical judgment.

### Rule E: Patient Data Privacy & Synthetic Data
- **No Real Patient Data:** Real Patient Health Information (PHI/PII) must NEVER be committed to the repository or logged.
- **Synthetic Data Only:** All test data, sample scenarios (e.g., `src/data/sampleScenarios.ts`), and mock inputs must be purely synthetic.
