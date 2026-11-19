@echo off
cd /d "%~dp0template"
node scripts\local-workbench.cjs verify
pause
