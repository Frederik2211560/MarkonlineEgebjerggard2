@echo off
setlocal
cd /d "%~dp0"
set "OPEN_BROWSER=1"

where py >nul 2>nul
if not errorlevel 1 (
  py server.py
  exit /b %errorlevel%
)

where python >nul 2>nul
if not errorlevel 1 (
  python server.py
  exit /b %errorlevel%
)

echo Python 3.10 eller nyere blev ikke fundet.
echo Installer Python, og vaelg "Add Python to PATH" under installationen.
pause
exit /b 1
