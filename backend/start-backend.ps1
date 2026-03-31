# Start Laravel backend. Default port: 8888.
# If you get "Failed to listen", run: php artisan serve --port=8000
# Then set backend .env APP_URL and frontend .env BACKEND_URL to that URL.

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$port = if ($args[0]) { $args[0] } else { 9000 }
Write-Host "Starting Laravel on http://127.0.0.1:$port" -ForegroundColor Cyan
Write-Host "Stop with Ctrl+C. If this port fails, run: .\start-backend.ps1 8000" -ForegroundColor Gray
Write-Host ""
& php artisan serve --port=$port
