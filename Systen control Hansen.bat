@echo off
cd /d "%~dp0"

REM Termina el proceso con PID 27120 si está activo
taskkill /PID 27120 /F 2>nul

REM Inicia el servidor en una nueva ventana de CMD minimizada
start /min cmd /c "npm start"

REM Minimiza esta ventana de terminal inmediatamente
if not "%minimized%"=="" goto :minimized
set minimized=true
start /min cmd /c "%~dpnx0" & exit
:minimized

REM Abre el navegador en modo pantalla completa (F11) usando Chrome
start chrome --start-fullscreen http://localhost:3000/