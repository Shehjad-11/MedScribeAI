@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules" (
    echo Dependencies are missing. Installing them now...
    call npm install
    if errorlevel 1 goto :error
)

call npm run dev
if errorlevel 1 goto :error
goto :eof

:error
echo.
echo The project could not be started. Check the error above.
pause
exit /b 1