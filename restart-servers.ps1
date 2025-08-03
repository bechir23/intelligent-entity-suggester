# Kill any existing processes
Write-Host "🔥 Killing existing Node.js processes..." -ForegroundColor Red
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Existing processes killed" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No existing processes found" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# Start Backend Server
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green
Set-Location "c:\Bureau\ahmed_project_upwork\server"
$backendJob = Start-Job -ScriptBlock {
    Set-Location "c:\Bureau\ahmed_project_upwork\server"
    node working-backend.cjs
}

# Wait for backend to start
Start-Sleep -Seconds 5

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend server is running!" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend server failed to start" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Start Frontend Server
Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Blue
Set-Location "c:\Bureau\ahmed_project_upwork"
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "c:\Bureau\ahmed_project_upwork"
    npm run dev
}

# Wait for frontend to start
Start-Sleep -Seconds 8

# Check if frontend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Frontend server is running!" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend server failed to start" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Open browsers
Write-Host "🌍 Opening applications..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"
Start-Process "http://localhost:3001/health"

Write-Host "`n✅ All services started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:3001" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Health Check: http://localhost:3001/health" -ForegroundColor Yellow

Write-Host "`n📊 Server Status:" -ForegroundColor Cyan
Write-Host "Backend Job ID: $($backendJob.Id)" -ForegroundColor Gray
Write-Host "Frontend Job ID: $($frontendJob.Id)" -ForegroundColor Gray

Write-Host "`nPress Ctrl+C to stop all servers or close this window" -ForegroundColor Yellow

# Keep the script running
try {
    while ($true) {
        Start-Sleep -Seconds 10
        
        # Check backend health
        try {
            $backendHealth = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2
            Write-Host "$(Get-Date -Format 'HH:mm:ss') - Backend: ✅ Running" -ForegroundColor Green
        } catch {
            Write-Host "$(Get-Date -Format 'HH:mm:ss') - Backend: ❌ Down" -ForegroundColor Red
        }
        
        # Check frontend health  
        try {
            $frontendHealth = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2
            Write-Host "$(Get-Date -Format 'HH:mm:ss') - Frontend: ✅ Running" -ForegroundColor Green
        } catch {
            Write-Host "$(Get-Date -Format 'HH:mm:ss') - Frontend: ❌ Down" -ForegroundColor Red
        }
    }
} finally {
    Write-Host "`n🔥 Cleaning up..." -ForegroundColor Red
    Remove-Job -Job $backendJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -Force -ErrorAction SilentlyContinue
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
}
