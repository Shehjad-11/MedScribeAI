# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

Security is paramount for clinical software. If you discover a security vulnerability or potential data privacy concern within MedScribe Lite:

1. **Do NOT open a public GitHub issue.**
2. Send a detailed report to security@medscribelite.com including:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
3. We will acknowledge receipt within 24 hours and provide regular updates on remediation.

---

## Last Security Review: 2026-07-31

### Audit Findings & Security Posture
- **Dependency Audit (`npm audit`)**: Clean — 0 high or critical vulnerabilities identified in installed packages.
- **Secret Management**: Verified zero committed secrets in git. `GEMINI_API_KEY` is strictly accessed via server environment variables (`process.env.GEMINI_API_KEY`) inside Node.js (`server.ts`) and is never exposed to client-side bundles.
- **Backend API & Error Handling**:
  - `server.ts` handles clinical API requests server-side.
  - Express backend sanitizes API error messages without leaking internal stack traces to HTTP client responses.
  - Server operates as an integrated Vite SPA / Express application on single-origin deployment; CORS middleware is strictly unexposed/scoped.
- **Prompt Injection & LLM Guardrails**:
  - System instructions enforce strict factual extraction from provided clinical transcripts.
  - Temperature set to `0.1` for factual precision and structured JSON schema enforcement (`responseMimeType: 'application/json'`).
  - **Implemented Remediation**: Prompt inputs in `server.ts` are wrapped in explicit boundary delimiter tags (`<patient_demographics>` and `<clinical_transcript>`), with system instructions explicitly dictating that all content within these tags must strictly be treated as raw data to extract from, never as system commands or instructions.
- **Data Persistence & LocalStorage**:
  - Browser `localStorage` key `medscribe_lite_encounters_v1` is used strictly for synthetic clinical encounter history demonstration and offline playback.
  - **Synthetic Data Disclaimer**: MedScribe Lite is designed for synthetic/demonstration clinical scenarios. No real Patient Health Information (PHI) or personally identifiable information (PII) should be persisted in browser local storage or transmitted in non-HIPAA compliant deployment environments.
