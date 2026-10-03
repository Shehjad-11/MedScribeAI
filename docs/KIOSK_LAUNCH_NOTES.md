# MedScribeAI — Kiosk Launch & Physical Deployment Guide

> **Deployment Spec**: MASTER_PROMPT Phase 13
> **Intended Environment**: Outpatient Primary Care Clinic / Rural Health Sub-Centre Kiosk Station

---

## 1. Physical Hardware Requirements & Recommendations

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Form Factor** | All-in-One Touchscreen PC or 12"+ Tablet | 21.5" Full HD Touchscreen Medical Terminal |
| **Operating System** | Windows 10 / 11 64-bit | Windows 10/11 IoT Enterprise (LTSC) |
| **Processor** | Intel Core i3 / AMD Ryzen 3 (Quad Core) | Intel Core i5 / AMD Ryzen 5 |
| **Memory** | 8 GB RAM | 16 GB RAM |
| **Storage** | 128 GB SSD (fast SQLite WAL performance) | 256 GB NVMe SSD |
| **Display** | 1920 x 1080 Multi-Touch Capacitive | 1920 x 1080 Anti-Glare Gorilla Glass Touch |
| **Audio** | Built-in microphone array + stereo speaker | Directional noise-cancelling desk mic + speaker |
| **Camera** | 1080p autofocus webcam (prescription scanning) | Document capture camera arm (overhead down-facing) |

---

## 2. Launching in Kiosk Mode (Fullscreen Locked Down)

### Option A: Google Chrome Kiosk Command
Run the following from PowerShell or a desktop shortcut:
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --kiosk `
  --disable-pinch `
  --overscroll-history-navigation=0 `
  --disable-features=TranslateUI `
  --no-first-run `
  --fast `
  --fast-start `
  "http://localhost:3000"
```

### Option B: Microsoft Edge Kiosk Mode
```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
  --kiosk "http://localhost:3000" `
  --edge-kiosk-type=fullscreen `
  --no-first-run
```

---

## 3. Critical Kiosk Safety & Isolation Guardrails

1. **3-Minute Inactivity Auto-Reset**:
   - If a patient walks away without completing the intake, an inactivity countdown modal appears after 2 minutes of idle time.
   - At 3 minutes, the session is wiped server-side (`POST /api/kiosk/session/reset`).
   - All draft clinical facts are permanently deleted from SQLite, ensuring Patient B cannot view or inherit Patient A's health data.
2. **Local-Only Offline Mode**:
   - For primary health centres without dependable broadband, toggle the Kiosk Privacy Flag or set `LOCAL_ONLY_MODE=true` in `.env`.
   - All outbound Cloud AI network calls are blocked with HTTP 403; the deterministic offline clinical rules handle symptom triage.
3. **Touch Targets**:
   - All interactive touch targets are designed with a minimum 48px height and width with high-contrast borders for accessibility by elderly or rural patients.

---

## 4. Clinic Infection Control & Disinfection SOP

- Physical kiosk screens in rural and ambulatory clinics encounter high touch frequency.
- Wipe screen surfaces with hospital-grade 70% Isopropyl Alcohol wipes between peak clinic shifts.
- Avoid spraying liquids directly onto capacitive screen bezels or microphone grilles.
