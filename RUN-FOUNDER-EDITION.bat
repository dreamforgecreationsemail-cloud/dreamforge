@echo off
REM DreamForge App Studio - Founder Edition - one-click run
title DreamForge App Studio - Founder Edition
cd /d "%~dp0"

if not exist package.json (
  echo.
  echo STOP - You opened me from inside the zip file.
  echo.
  echo You are in a Temp folder right now, not the real folder.
  echo That is why I cannot find package.json.
  echo.
  echo DO THIS INSTEAD:
  echo 1. Close this window.
  echo 2. Find the zip file. Right-click it. Click Extract All.
  echo 3. Open the NEW folder it makes. You will see package.json in there.
  echo 4. Double-click RUN-FOUNDER-EDITION.bat IN THAT NEW FOLDER.
  echo.
  echo Do NOT double-click me while I am still inside the zip.
  echo.
  echo Current folder is: %CD%
  echo.
  pause
  exit /b 1
)

echo Found the project in: %CD%
echo.

where bun >nul 2>&1
if errorlevel 1 (
  echo Bun is not installed yet. Installing it now...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "irm bun.sh/install.ps1 | iex"
  echo.
  echo Bun installed. Close this window, then double-click this file again.
  pause
  exit /b 0
)

echo Step 1 of 3: bun install...
call bun install
if errorlevel 1 (
  echo.
  echo bun install failed. Copy the error above and check the error output or open a GitHub issue.
  pause
  exit /b 1
)

echo.
echo Step 2 of 3: bun run build...
call bun run build
if errorlevel 1 (
  echo.
  echo Build failed. Copy the error above and check the error output or open a GitHub issue.
  pause
  exit /b 1
)

echo.
echo Step 3 of 3: starting the app...
echo Open http://localhost:3000/ in your browser.
echo Keep this window open while you use the app. Close it to stop the app.
echo.
call bun run start
pause
