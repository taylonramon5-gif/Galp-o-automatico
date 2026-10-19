@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Instale o Node.js 18 ou superior: https://nodejs.org & pause & exit /b)
if not exist .env copy .env.example .env >nul
start "" http://localhost:3000
node src\server.js
pause
