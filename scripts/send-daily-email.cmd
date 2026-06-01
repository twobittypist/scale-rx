@echo off
setlocal

cd /d "%~dp0.."

if not exist "logs" mkdir "logs"

"C:\Program Files\nodejs\node.exe" "src\cli.js" --email >> "logs\scale-rx.log" 2>&1
