# AI 角色聊天项目 - PowerShell 启动脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI 角色聊天项目 - 一键启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否配置了 API Key
$envContent = Get-Content "backend\.env" -ErrorAction SilentlyContinue
if (-not ($envContent -match "DEEPSEEK_API_KEY=sk-")) {
    Write-Host "[警告] 请先配置 backend\.env 中的 DEEPSEEK_API_KEY" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按 Enter 键退出"
    exit 1
}

Write-Host "[1/3] 检查依赖..." -ForegroundColor Green

# 检查后端依赖
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "[后端] 正在安装依赖..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# 检查前端依赖
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "[前端] 正在安装依赖..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host ""
Write-Host "[2/3] 启动后端服务..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run start:dev"
Start-Sleep -Seconds 3

Write-Host "[3/3] 启动前端服务..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ 项目已启动！" -ForegroundColor Green
Write-Host "  后端: http://localhost:3000" -ForegroundColor White
Write-Host "  前端: http://localhost:5173" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "提示: 关闭新打开的两个窗口即可停止服务" -ForegroundColor Yellow
Write-Host ""
Read-Host "按 Enter 键关闭此窗口"
