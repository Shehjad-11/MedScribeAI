# MedScribeAI — Optional Protected Tunnel Architecture Specification

> **GOVERNANCE & SAFETY INVARIANT (PHASE 14)**:
> - **DISABLED BY DEFAULT**: Tunneling is strictly disabled in development and automated testing.
> - **ZERO HOSTING CONTACT**: No external tunneling services (ngrok, Cloudflare Tunnel, localtunnel) are contacted during installation or test execution.
> - **SYNTHETIC DATA ENFORCEMENT**: Remote tunneling is strictly forbidden when non-synthetic data is loaded.
> - **ACCESS CONTROL MANDATORY**: Any tunnel demonstration requires pre-shared bearer token authentication or mutual TLS.

---

## 1. Threat Model & Remote Exposure Risks

When exposing an outpatient clinical prototype over a public tunnel for remote evaluator review (e.g. SIH jury):

| Threat | Impact | Mandatory Architectural Mitigation |
| :--- | :--- | :--- |
| **Unauthenticated Public Access** | Unauthorized inspection of test cases | Edge access control required (Cloudflare Access / HTTP Basic Auth) |
| **Data Leakage** | Exposure of sensitive clinical data | 100% Synthetic Data Policy strictly enforced; real patient PHI prohibited |
| **Denial of Service** | Flooding kiosk endpoints | Sliding-window rate limiter (60 req/min) active on all kiosk routes |
| **Credential Interception** | Compromised clinician login | Mandatory HTTPS / TLS 1.3 termination at edge |

---

## 2. Configuration & Pre-Flight Checklist

Before any evaluator tunnel is activated, the following environment flags must be verified in `.env`:

```env
# 1. Force Synthetic / Demo Mode
DEMO_MODE=true
SYNTHETIC_DATA_ONLY=true

# 2. Require Edge Access Token
TUNNEL_ACCESS_TOKEN="sih2026-evaluator-demo-key-xyz"

# 3. Restrict Allowed Origins
CORS_ORIGIN="https://evaluator.medscribe.internal"
```

---

## 3. Disabling Steps (Default Safe State)

To guarantee that the application remains strictly local and air-gapped:
1. `TUNNEL_ENABLED` is omitted or set to `"false"` in `.env`.
2. The server binds exclusively to `127.0.0.1` or internal loopback.
3. No background daemon or port forwarding utility is spawned.

---

## 4. Evaluator Demonstration Tunnel (Template Script Only)

If an authorized administrator needs to demonstrate the prototype to remote SIH judges:
1. Verify `npm run test` passes 100% locally.
2. Execute the pre-flight verification script:
   ```powershell
   npx tsx scripts/tunnelGuide.ts
   ```
3. Use a protected SSH or Cloudflare tunnel with access control:
   ```bash
   # Example Cloudflare Zero Trust tunnel with token authentication:
   # cloudflared tunnel --url http://localhost:3000 --http-host-header localhost
   ```
4. Immediately terminate the tunnel session after the evaluation concludes.
