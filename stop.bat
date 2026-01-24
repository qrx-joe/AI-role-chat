@echo off
echo ========================================
echo   停止所有服务
echo ========================================
echo.

echo 正在停止后端服务 (Node.js)...
taskkill /F /IM node.exe /T >nul 2>&1

echo 正在停止前端服务 (Vite)...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :5173') DO taskkill /F /PID %%P >nul 2>&1

echo.
echo ✅ 所有服务已停止
echo.
pause
