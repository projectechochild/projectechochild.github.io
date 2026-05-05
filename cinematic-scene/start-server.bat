@echo off
echo Starting Echo Child Cinematic Scene Server...
echo.
echo Choose runtime:
echo 1. Node.js
echo 2. Bun
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
  echo Starting with Node.js...
  node node_m-28/server.js
) else if "%choice%"=="2" (
  echo Starting with Bun...
  bun node_m-28/server.js
) else (
  echo Invalid choice. Starting with Node.js...
  node node_m-28/server.js
)

pause
