@echo off
chcp 65001 >nul
echo ========================================
echo   Stopping all services
echo ========================================
echo.

echo Stopping backend service (Node.js)...
taskkill /F /IM node.exe /T >nul 2>&1

echo Stopping frontend service (Vite)...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :5173') DO taskkill /F /PID %%P >nul 2>&1

echo.
echo SUCCESS! All services stopped
echo.
pause

