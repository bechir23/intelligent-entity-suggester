@echo off
echo Killing existing Node.js processes...
taskkill /f /im node.exe 2>nul

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo Starting Backend Server...
cd /d "c:\Bureau\ahmed_project_upwork\server"
start "Backend Server" cmd /k "node working-backend.cjs"

echo Waiting 5 seconds for backend...
timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
cd /d "c:\Bureau\ahmed_project_upwork"
start "Frontend Server" cmd /k "npm run dev"

echo Waiting 8 seconds for frontend...
timeout /t 8 /nobreak >nul

echo Opening browsers...
start "" "http://localhost:5173"
start "" "http://localhost:3001/health"

echo All servers started!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause >nul
