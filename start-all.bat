@echo off
title ZeroTrustX Launcher
echo ========================================================
echo   Launching ZeroTrustX Adaptive Access Security Platform
echo   Principle: NEVER TRUST, ALWAYS VERIFY
echo ========================================================
echo.

echo [1/3] Starting Python ML Risk Engine (Port 5001)...
start "ZeroTrustX - ML Risk Engine [5001]" cmd /k "cd /d %~dp0services\risk-engine && py -3.11 app.py"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Express Backend API (Port 3001)...
start "ZeroTrustX - Backend API [3001]" cmd /k "cd /d %~dp0apps\api && npm run dev"

timeout /t 2 /nobreak >nul

echo [3/3] Starting React Vite Frontend (Port 5173)...
start "ZeroTrustX - Frontend [5173]" cmd /k "cd /d %~dp0apps\web && npm run dev"

echo.
echo ========================================================
echo   All 3 ZeroTrustX services have been launched!
echo.
echo   - Web Frontend:  http://localhost:5173
echo   - Backend API:   http://localhost:3001
echo   - ML Risk Engine: http://localhost:5001
echo ========================================================
echo.
pause

