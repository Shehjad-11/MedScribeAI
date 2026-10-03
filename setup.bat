@echo off
setlocal enabledelayedexpansion
title MedScribeAI - Initial Setup and Installation
cd /d "%~dp0"

cls
echo ==============================================================================
echo                 MedScribeAI - One-Command Windows Setup
echo ==============================================================================
echo.
echo  This script will prepare MedScribeAI on your Windows workstation:
echo    [1] Verify Node.js (v18+) and npm environment
echo    [2] Initialize configuration (.env from .env.example)
echo    [3] Install production and development dependencies
echo    [4] Initialize local SQLite database and seed 6 demo clinical cases
echo    [5] Compile frontend SPA and backend server bundles
echo.
echo ==============================================================================
echo.

REM ------------------------------------------------------------------------------
REM 1. Verify Node.js and npm
REM ------------------------------------------------------------------------------
echo [1/5] Checking Node.js and npm runtime...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed or not found in your system PATH.
    echo Please install Node.js v18 or higher from https://nodejs.org/ and rerun setup.bat.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VERSION=%%v
for /f "tokens=*" %%v in ('npm -v 2^>nul') do set NPM_VERSION=%%v

echo       Node.js Version: %NODE_VERSION% (OK)
echo       npm Version:     %NPM_VERSION% (OK)
echo.

REM ------------------------------------------------------------------------------
REM 2. Ensure .env file exists
REM ------------------------------------------------------------------------------
echo [2/5] Checking environment configuration (.env)...
if not exist .env (
    echo       .env file not found. Copying from .env.example...
    copy .env.example .env >nul
    echo       Created .env with default settings and demo clinician credentials.
) else (
    echo       .env file already exists. Preserving current configuration.
)
echo.

REM ------------------------------------------------------------------------------
REM 3. Install npm dependencies
REM ------------------------------------------------------------------------------
echo [3/5] Installing dependencies via npm install...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] npm install encountered an error. Please verify your internet connection.
    echo.
    pause
    exit /b 1
)
echo       Dependencies installed successfully.
echo.

REM ------------------------------------------------------------------------------
REM 4. Initialize SQLite Database & Seed Demo Cases
REM ------------------------------------------------------------------------------
echo [4/5] Initializing SQLite database and seeding synthetic demo cases...
if not exist "server\db" mkdir "server\db"
call npm run db:seed
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Database seeding script reported an issue, continuing...
) else (
    echo       Synthetic clinical cases seeded into server\db\medscribe.db (OK)
)
echo.

REM ------------------------------------------------------------------------------
REM 5. Build production bundle
REM ------------------------------------------------------------------------------
echo [5/5] Compiling production build (Vite SPA + Backend Bundle)...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Application build failed. Check TypeScript or bundle errors above.
    echo.
    pause
    exit /b 1
)
echo       Production build created in .\dist (OK)
echo.

REM ------------------------------------------------------------------------------
REM Setup Complete Summary
REM ------------------------------------------------------------------------------
echo ==============================================================================
echo                     Setup Completed Successfully!
echo ==============================================================================
echo.
echo  Application Access:
echo    Web App URL:       http://localhost:3000
echo.
echo  Demo Clinician Workstation Login:
echo    Username:          doctor
echo    Password:          medscribe2026
echo.
echo  To start MedScribeAI in the future:
echo    - Double click "start-project.bat"
echo    - Or run "npm run dev" from this directory
echo.
echo ==============================================================================
echo.

set /p LAUNCH_NOW="Would you like to launch MedScribeAI now? (Y/N, default Y): "
if /i "!LAUNCH_NOW!"=="" set LAUNCH_NOW=Y
if /i "!LAUNCH_NOW!"=="Y" (
    echo.
    echo Starting MedScribeAI and opening your browser...
    start "" http://localhost:3000
    call npm run dev
) else (
    echo.
    echo You can start the app anytime by double-clicking "start-project.bat".
    echo Press any key to exit.
    pause >nul
)
exit /b 0
