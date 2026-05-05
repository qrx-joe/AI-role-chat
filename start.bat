@echo off
chcp 65001 >nul
echo ========================================
echo   AI Role Chat - Quick Start Script
echo ========================================
echo.

REM Check API Key configuration
findstr /C:"DEEPSEEK_API_KEY=sk-" backend\.env >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] DeepSeek API Key not configured or invalid format
    echo TIP: Please configure real API Key in backend\.env (starts with sk-)
    echo NOTE: Without real API Key, AI chat function will not work
    echo.
    echo Press any key to continue (for testing other features) or Ctrl+C to cancel...
    pause >nul
    echo.
)

echo [1/3] Checking dependencies...
cd backend
if not exist node_modules (
    echo [Backend] Installing dependencies...
    call npm install
)
cd ..

cd frontend
if not exist node_modules (
    echo [Frontend] Installing dependencies...
    call npm install
)
cd ..

echo.
echo [2/3] Starting backend service...
start "AI Chat - Backend" cmd /k "cd backend && npm run start:dev"

echo Waiting for backend to be ready...
:wait_loop
timeout /t 2 /nobreak >nul
curl -s http://localhost:3000/api/roles >nul 2>&1
if %errorlevel% neq 0 (
    echo   Still waiting...
    goto wait_loop
)
echo   Backend is ready!

echo [3/3] Starting frontend service...
start "AI Chat - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   SUCCESS! Project started!
echo   Backend: http://localhost:3000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to close this window...
pause >nul

