# MedScribeAI — Field Failure Recovery & Operations Guide

> **Operations Spec**: MASTER_PROMPT Phase 13
> Comprehensive recovery procedures for field operators, clinic technicians, and demonstration administrators.

---

## 1. Quick Diagnostic Health Check

Before troubleshooting, inspect the health endpoint:
```powershell
curl http://localhost:3000/api/health
```
Expected response:
```json
{
  "status": "ok",
  "app": "MedScribeAI",
  "version": "1.0.0",
  "sqlite": "connected",
  "activeCasesCount": 5,
  "localOnlyMode": false,
  "geminiConfigured": true
}
```

---

## 2. Common Failure Scenarios & Recovery Procedures

### Scenario A: Port 3000 Conflict (`EADDRINUSE`)
**Symptom**: `Error: listen EADDRINUSE: address already in use 0.0.0.0:3000`
**Root Cause**: A previous server instance or background task did not terminate cleanly.
**Recovery Steps**:
1. Find the PID using port 3000:
   ```powershell
   Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
   ```
2. Terminate the blocking process:
   ```powershell
   Stop-Process -Id <PID> -Force
   ```
3. Restart server: `npm run dev` or `npm start`.

---

### Scenario B: SQLite Database Locked / Stale WAL Files
**Symptom**: `SqliteError: database is locked`
**Root Cause**: Multi-process concurrent write or abruptly terminated Node process holding WAL lock.
**Recovery Steps**:
1. Stop all running Node.js server processes.
2. In `server/db/`:
   ```powershell
   # If safe, remove temporary WAL and SHM files (SQLite will re-create them cleanly)
   Remove-Item server/db/medscribe.db-wal -ErrorAction SilentlyContinue
   Remove-Item server/db/medscribe.db-shm -ErrorAction SilentlyContinue
   ```
3. Re-seed demo data if needed:
   ```powershell
   npm run db:seed
   ```

---

### Scenario C: Cloud Gemini API Quota Exhausted or Internet Down
**Symptom**: `Internal Server Error: Gemini API quota exceeded` or `FetchError: network timeout`
**Fail-Safe Invariant**: **MedScribeAI NEVER fabricates clinical findings when an API fails.**
**Recovery Steps**:
1. The built-in client automatically degrades to the **Offline Local Engine**.
2. A prominent amber warning banner informs the clinician that offline mode is active.
3. Structured intake facts, versioned red flags, and the 9-rule deterministic drug interaction checker continue to operate with 100% offline accuracy.
4. To force local-only mode deliberately:
   Set `LOCAL_ONLY_MODE=true` in `.env` and restart the server.

---

### Scenario D: Database Corruption or Data Reset Required
**Symptom**: Malformed SQLite file or corrupted demo state.
**Recovery Steps**:
1. Create a fresh backup of current state:
   ```powershell
   npm run db:backup
   ```
2. To reset to a fresh baseline:
   ```powershell
   Remove-Item server/db/medscribe.db* -Force
   npm run db:seed
   ```
3. To restore from a prior backup in `backups/`:
   ```powershell
   Copy-Item backups/medscribe_backup_<TIMESTAMP>.db server/db/medscribe.db -Force
   ```

---

### Scenario E: Microphone Permission Blocked in Browser
**Symptom**: "Microphone access denied" error when clicking the dictation button.
**Recovery Steps**:
1. In Google Chrome / Edge: Click the lock icon in the browser address bar.
2. Under "Permissions", toggle **Microphone** to **Allow**.
3. Refresh page (`Ctrl + F5`).
4. **Failsafe**: If hardware mic is unavailable, use the **Manual Fallback** or select one of the pre-loaded primary care clinical scenarios.

---

### Scenario F: Physical Kiosk Needs Session Wipe
**Symptom**: Patient walked away mid-intake; draft information remains on screen.
**Recovery Steps**:
1. Touch the red **"Reset Session"** button on the bottom left of the kiosk interface.
2. Confirm session wipe in the modal.
3. All patient facts are purged from memory and unsubmitted drafts are permanently deleted from SQLite.
