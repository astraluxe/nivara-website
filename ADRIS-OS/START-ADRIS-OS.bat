@echo off
REM ─── Double-click this. That's the whole thing. ──────────────────────────────
REM
REM Starts the Ubuntu VM's desktop server, the adris OS shell and the agent
REM bridge, then opens Remote Desktop. adris OS appears fullscreen by itself
REM once you log in — no browser to open, no URL to type.
REM
REM Login:  amogh  /  the password set for the Ubuntu account
REM         (see vm\.local-credentials.txt — gitignored)

setlocal
title Starting adris OS

echo.
echo   Starting adris OS...
echo   (first run after a reboot takes ~20 seconds)
echo.

REM Everything inside the VM. -u root so no password is needed for the parts
REM that bind ports and switch user.
wsl -d Ubuntu -u root -e bash /mnt/c/Users/amogh/OneDrive/Desktop/NIVARA/ADRIS-OS/vm/start-adris-os.sh

if errorlevel 1 (
  echo.
  echo   Something did not start. The lines above say which part.
  echo.
  pause
  exit /b 1
)

echo   Opening Remote Desktop...
start "" mstsc.exe /v:localhost:3390

echo.
echo   Log in as: amogh
echo   adris OS opens by itself once you are in.
echo.
timeout /t 6 >nul
endlocal
