# Simple startup script - Run backend and frontend separately

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ALOEVERAMATE - Quick Start" -ForegroundColor Cyan  
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "STEP 1: Start Backend Server" -ForegroundColor Yellow
Write-Host "  Open a terminal and run: cd apps\server; python run.py`n" -ForegroundColor Gray

Write-Host "STEP 2: Start Mobile App" -ForegroundColor Yellow
Write-Host "  Open another terminal and run: cd apps\mobile; npx expo start --clear`n" -ForegroundColor Gray

Write-Host "IMPORTANT: Your computer's IP is 192.168.8.194" -ForegroundColor Green
Write-Host "The mobile app will connect to: http://192.168.8.194:8000`n" -ForegroundColor Green

Write-Host "Press any key to start the mobile app in this terminal..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

cd apps\mobile
npx expo start --clear
