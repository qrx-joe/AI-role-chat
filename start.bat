@echo off
echo ========================================
echo   AI 角色聊天项目 - 一键启动脚本
echo ========================================
echo.

REM 检查是否配置了 API Key
findstr /C:"DEEPSEEK_API_KEY=sk-" backend\.env >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] 请先配置 backend\.env 中的 DEEPSEEK_API_KEY
    echo.
    pause
    exit /b 1
)

echo [1/3] 检查依赖...
cd backend
if not exist node_modules (
    echo [后端] 正在安装依赖...
    call npm install
)
cd ..

cd frontend
if not exist node_modules (
    echo [前端] 正在安装依赖...
    call npm install
)
cd ..

echo.
echo [2/3] 启动后端服务...
start "AI Chat - Backend" cmd /k "cd backend && npm run start:dev"
timeout /t 3 /nobreak >nul

echo [3/3] 启动前端服务...
start "AI Chat - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   ✅ 项目已启动！
echo   后端: http://localhost:3000
echo   前端: http://localhost:5173
echo ========================================
echo.
echo 按任意键关闭此窗口...
pause >nul
