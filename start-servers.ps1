# Start Backend Server
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green
Set-Location "c:\Bureau\ahmed_project_upwork\server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node working-backend.cjs" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend Server  
Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Blue
Set-Location "c:\Bureau\ahmed_project_upwork"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

# Wait a moment for frontend to start
Start-Sleep -Seconds 3

# Open test page
Write-Host "🧪 Opening Test Page..." -ForegroundColor Yellow
Start-Process "c:\Bureau\ahmed_project_upwork\test-current-fixes.html"

# Open localhost
Write-Host "🌍 Opening Frontend..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:3001" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Test Page: test-current-fixes.html" -ForegroundColor Yellow

Read-Host "Press Enter to exit"
