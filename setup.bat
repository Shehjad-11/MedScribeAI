@echo off
REM ==============================================================================
REM MedScribeAI — One-Command Windows Setup Script (Phase 13)
REM ==============================================================================

echo.
echo ==============================================================================
echo                 MedScribeAI — Local Setup and Installation
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

echo [OK] Node.js found:
node -v
echo.

REM 2. Check for .env file; create from .env.example if missing
if not exist .env (
    echo [Setup] .env file not found. Copying from .env.example...
    copy .env.example .env
    echo [Setup] Created .env file. Remember to configure your GEMINI_API_KEY if testing cloud features.
) else (
    echo [OK] .env configuration file exists.
)
echo.

REM 3. Install npm dependencies
echo [Setup] Installing dependencies (npm install)...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)
echo [OK] Dependencies installed successfully.
echo.

REM 4. Build application bundle
echo [Setup] Building frontend SPA and backend bundle (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build step failed.
    pause
    exit /b 1
)
echo [OK] Production build created in ./dist.
echo.

REM 5. Seed synthetic demonstration dataset
echo [Setup] Seeding synthetic demonstration dataset into SQLite...
call npm run db:seed
if %errorlevel% neq 0 (
    echo [WARNING] Database seeding encountered an error. Proceeding anyway.
)
echo.

echo ==============================================================================
echo                       Setup Completed Successfully!
echo ==============================================================================
echo.
echo To launch MedScribeAI locally:
echo.
echo   Development Mode (Hot Reload):
echo     npm run dev
echo.
echo   Production Mode (Bundled):
echo     npm start
echo.
echo Open your browser at: http://localhost:3000
echo.
echo Default Clinician Login (Demo Account):
echo   Username: doctor
echo   Password: medscribe2026
echo.
pause
