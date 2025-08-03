@echo off
echo Starting Backend Server...
cd /d "c:\Bureau\ahmed_project_upwork\server"
start "Backend Server" cmd /k "node working-backend.cjs"

echo Starting Frontend Server...
cd /d "c:\Bureau\ahmed_project_upwork"
start "Frontend Server" cmd /k "npm run dev"

echo Opening Test Page...
start "" "c:\Bureau\ahmed_project_upwork\test-current-fixes.html"

echo Servers started! Check the opened windows.
pause
