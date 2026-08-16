@echo off
cd /d "%~dp0"

where pythonw >nul 2>&1
if errorlevel 1 (
    echo Python wurde nicht gefunden.
    echo Bitte Python von https://www.python.org/downloads/ installieren.
    pause
    exit /b 1
)

start "" pythonw "%~dp0server.py"
