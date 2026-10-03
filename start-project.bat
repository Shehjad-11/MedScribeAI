@echo off
setlocal enabledelayedexpansion
title MedScribeAI - Primary Care Clinical Copilot
cd /d "%~dp0"

cls
echo ==============================================================================
echo                 MedScribeAI - Primary Care Clinical Copilot
echo ==============================================================================
echo.
echo  Starting preflight environment checks...
echo.

REM ------------------------------------------------------------------------------
REM 1. Verify Node.js
REM ------------------------------------------------------------------------------
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH.
    echo Please install Node.js v18 or higher from https://nodejs.org/ and try again.
    echo Or run "setup.bat" to perform the full workstation installation.
    echo.
    pause
    exit /b 1
)

REM ------------------------------------------------------------------------------
REM 2. Ensure .env exists
REM ------------------------------------------------------------------------------
if not exist .env (
    echo [Setup] .env file not found. Initializing from .env.example...
    copy .env.example .env >nul
    echo [Setup] Created .env configuration with demo clinician credentials.
)

REM ------------------------------------------------------------------------------
REM 3. Ensure dependencies are installed
REM ------------------------------------------------------------------------------
if not exist "node_modules" (
    echo [Setup] Dependencies are missing. Installing them now (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies. Please run "setup.bat".
        pause
        exit /b 1
    )
)

REM ------------------------------------------------------------------------------
REM 4. Ensure SQLite database & demo cases are initialized
REM ------------------------------------------------------------------------------
if not exist "server\db\medscribe.db" (
    echo [Setup] Initializing SQLite database and seeding 6 demo clinical cases...
    if not exist "server\db" mkdir "server\db"
    call npm run db:seed
)

REM ------------------------------------------------------------------------------
REM 5. Port 3000 Check
REM ------------------------------------------------------------------------------
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>nul
if %errorlevel% equ 0 (
    echo [Notice] Port 3000 is currently occupied.
    echo If another MedScribeAI instance is running, you can connect directly at:
    echo http://localhost:3000
    echo.
)

REM ------------------------------------------------------------------------------
REM Display Launch Information Banner
REM ------------------------------------------------------------------------------
cls
echo ==============================================================================
echo                 MedScribeAI - Primary Care Clinical Copilot
echo ==============================================================================
echo.
echo   Application URL:   http://localhost:3000
echo.
echo   Demo Clinician Workstation Login:
echo     Username:        doctor
echo     Password:        medscribe2026
echo.
echo   Active Capabilities:
echo     - Patient Kiosk Intake & Red-Flag Triage (10 complaints, multilingual)
echo     - Clinician Triage Queue & Preloaded Consultation Workstation
echo     - Autonomous Dual-Engine SOAP Generator (Online Gemini + Offline Local)
echo     - AYUSH Classical Intake (Prakriti & Agni Assessment)
echo     - FHIR R4 Bundle Export & ABDM Milestones Mock Adapter
echo     - AES-256-GCM Encrypted Document Storage
echo.
echo ==============================================================================
echo.
echo Starting development server on http://localhost:3000...
echo Opening browser window...
echo (Press Ctrl+C in this terminal window to stop the server)
echo.

REM Open browser after 2 seconds via a non-blocking background command
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo ==============================================================================
    echo [ERROR] The MedScribeAI server encountered an unexpected error.
    echo.
    echo Common troubleshooting steps:
    echo   1. Check if another process is using port 3000:
    echo        netstat -ano ^| findstr :3000
    echo   2. Re-run initial setup to rebuild modules:
    echo        setup.bat
    echo   3. Verify Node.js version is v18 or higher:
    echo        node -v
    echo ==============================================================================
    echo.
    pause
    exit /b 1
)

goto :eof