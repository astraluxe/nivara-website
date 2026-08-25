@echo off
REM ─── Double-click this to run adris OS. ─────────────────────────────────────
REM
REM Starts the Ubuntu VM's desktop, the adris OS shell and the agent bridge,
REM then opens Remote Desktop. adris OS opens by itself when you log in.
REM
REM Login:  amogh  /  the Ubuntu password (see vm\.local-credentials.txt)
REM
REM IF YOU ARE ALREADY CONNECTED when you run this: log out of the Ubuntu
REM desktop and back in, or double-click the "adris OS" icon on its desktop.
REM Autostart only fires at LOGIN, so an already-open session won't change
REM on its own.

setlocal
title Starting adris OS

echo.
echo   Starting adris OS...
echo   (about 20 seconds on the first run after a reboot)
echo.

wsl -d Ubuntu -u root -e bash /mnt/c/Users/amogh/OneDrive/Desktop/NIVARA/ADRIS-OS/vm/start-adris-os.sh

if errorlevel 1 (
  echo.
  echo   Something did not start - the lines above say which part.
  echo.
  pause
  exit /b 1
)

echo   Opening Remote Desktop...
start "" mstsc.exe /v:localhost:3390

echo.
echo   ============================================================
echo     Log in as:  amogh
echo.
echo     adris OS opens by itself once you are logged in.
echo.
echo     Already logged in from before? Either log out and back
echo     in, or double-click the "adris OS" icon on the Ubuntu
echo     desktop. Autostart only runs at login.
echo   ============================================================
echo.
timeout /t 8 >nul
endlocal
