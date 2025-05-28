@echo off
cd /d "%~dp0"

REM Inicia el servidor (deja la consola abierta)
start cmd /k "npm start"

REM Espera 5 segundos (ajustable)
timeout /t 0 /nobreak >nul

REM Abre el navegador
start http://localhost:3000
