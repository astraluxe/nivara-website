$ErrorActionPreference = 'Stop'
$url = "https://github.com/astraluxe/nivara-desktop/releases/latest/download/adris-setup.exe"
$tmp = "$env:TEMP\adris-setup.exe"

Write-Host ""
Write-Host "adris.tech installer for Windows" -ForegroundColor Cyan
Write-Host "─────────────────────────────────"
Write-Host "Downloading..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing
Write-Host "Running installer..." -ForegroundColor Cyan
Start-Process -FilePath $tmp -Wait
try { Remove-Item $tmp -ErrorAction SilentlyContinue } catch {}
Write-Host ""
Write-Host "Done! adris.tech is installed." -ForegroundColor Green
Write-Host "If SmartScreen appeared, click 'More info' then 'Run anyway'."
