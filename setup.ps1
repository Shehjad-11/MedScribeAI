# ==============================================================================
# MedScribeAI — One-Command Windows PowerShell Setup Script (Phase 13)
# ==============================================================================

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "                MedScribeAI — Local Setup and Installation" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not found in your PATH." -ForegroundColor Red
    Write-Host "Please install Node.js v18 or higher from https://nodejs.org/ and try again."
    exit 1
}

$nodeVer = node -v
Write-Host "[OK] Node.js found: $nodeVer" -ForegroundColor Green

# 2. Check for .env file; create from .env.example if missing
if (-not (Test-Path ".env")) {
    Write-Host "[Setup] .env file not found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "[Setup] Created .env file. Remember to configure your GEMINI_API_KEY if testing cloud features." -ForegroundColor Green
} else {
    Write-Host "[OK] .env configuration file exists." -ForegroundColor Green
}

# 3. Install npm dependencies
Write-Host ""
Write-Host "[Setup] Installing dependencies (npm install)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] npm install failed." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependencies installed successfully." -ForegroundColor Green

# 4. Build application bundle
Write-Host ""
Write-Host "[Setup] Building frontend SPA and backend bundle (npm run build)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build step failed." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Production build created in ./dist." -ForegroundColor Green

# 5. Seed synthetic demonstration dataset
Write-Host ""
Write-Host "[Setup] Seeding synthetic demonstration dataset into SQLite..." -ForegroundColor Yellow
npm run db:seed

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "                      Setup Completed Successfully!" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To launch MedScribeAI locally:"
Write-Host ""
Write-Host "  Development Mode (Hot Reload):" -ForegroundColor White
Write-Host "    npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Production Mode (Bundled):" -ForegroundColor White
Write-Host "    npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "Open your browser at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default Clinician Login (Demo Account):"
Write-Host "  Username: doctor"
Write-Host "  Password: medscribe2026"
Write-Host ""
