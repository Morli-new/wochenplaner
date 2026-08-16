@echo off
cd /d "%~dp0"
start "" pythonw -m http.server 8420
timeout /t 1 /nobreak >nul
start "" http://localhost:8420
