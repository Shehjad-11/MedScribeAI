@echo off
setlocal
cd /d "%~dp0"

echo ==============================================================================
echo                      MedScribeAI — Launching Application
echo ==============================================================================
echo.

REM 1. Verify Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH.
    echo Please install Node.js v18 or higher from https://nodejs.org/ and try again.
    pause
    exit /b 1
)

REM 2. Ensure .env file exists
if not exist .env (
    echo [Setup] .env file not found. Initializing from .env.example...
    copy .env.example .env >nul
    echo [Setup] Created .env configuration file.
)

REM 3. Install dependencies if node_modules missing
if not exist "node_modules" (
    echo [Setup] Dependencies missing. Installing now (npm install)...
    call npm install
    if errorlevel 1 goto :error
)

REM 4. Ensure demo SQLite database is initialized
if not exist "medscribe.db" (
    echo [Setup] Initializing SQLite database and seeding demo cases...
    call npm run db:seed
)

echo.
echo ==============================================================================
echo Starting MedScribeAI in development mode...
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:3000
echo   Clinician: Username: doctor  ^|  Password: medscribe2026
echo ==============================================================================
echo.

call npm run dev
if errorlevel 1 goto :error
goto :eof

:error
echo.
echo [ERROR] The project could not be started. Please review the error above.
pause
exit /b 1