#!/usr/bin/env bash
# ─── Which OS you get when you log in ────────────────────────────────────────
#
# THE POINT: adris OS should BE the computer, not a window sitting on top of one. Until now the
# session started XFCE — a full desktop with its own panel, wallpaper and desktop icons — and then
# opened adris OS as a window inside it. Move the mouse to the top and there was a title bar; close
# it and XFCE was still there. That is a program running on a desktop, not an operating system, and
# it was rightly called out as faking it.
#
#   adris   → the X session runs a minimal window manager and adris OS, fullscreen, and NOTHING
#             else. No panel, no desktop, no icons — there is no desktop behind it because none is
#             started. Real Linux apps still open as real windows on top, which is what any OS does.
#   ubuntu  → the ordinary XFCE desktop, untouched, for when you want the plain machine.
#
# This is the "off switch" from plan.md §10 in its simplest form: one command, reversible, nothing
# deleted either way. Takes effect at the NEXT login — an X session cannot be swapped underneath
# itself.
#
# Usage:
#   wsl -d Ubuntu -u root -e bash vm/set-session.sh adris
#   wsl -d Ubuntu -u root -e bash vm/set-session.sh ubuntu

set -euo pipefail

MODE="${1:-}"
if [ "$MODE" != "adris" ] && [ "$MODE" != "ubuntu" ]; then
  echo "Usage: set-session.sh adris|ubuntu"
  exit 1
fi

DESKTOP_USER="${SUDO_USER:-amogh}"
id "$DESKTOP_USER" >/dev/null 2>&1 || DESKTOP_USER="$(getent passwd 1000 | cut -d: -f1)"
USER_HOME="$(getent passwd "$DESKTOP_USER" | cut -d: -f6)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$USER_HOME/.config/openbox"

if [ "$MODE" = "adris" ]; then
  cat > "$USER_HOME/.xsession" <<'SESSION'
#!/bin/sh
# ── The adris OS session ─────────────────────────────────────────────────────
# This file IS the desktop. Whatever runs here is the whole environment, so what is absent matters
# as much as what is present: no panel, no desktop manager, no file-manager-drawing-the-background.
# There is nothing behind adris OS because nothing else is started.

# No screen blanking mid-demo, and no power management in a VM that has no battery to save.
xset s off -dpms 2>/dev/null

# A minimal window manager, so real applications (LibreOffice, Files, a terminal) get titlebars,
# focus and stacking like normal windows. Without one they would open unmanaged and unmovable.
# Openbox draws no desktop of its own, which is exactly why it is the one used here.
openbox &

# Wait for the shell to answer before opening the window — on a cold login the browser otherwise
# arrives first, lands on a connection error, and stays there looking like a broken product.
for i in $(seq 1 60); do
  curl -sf -o /dev/null http://localhost:5173/ && break
  sleep 1
done

# adris OS itself. `exec` makes it the session leader: when this window closes, the session ends
# and you are returned to the login screen — the same as quitting any desktop.
exec epiphany-browser http://localhost:5173/
SESSION

  # Fullscreen it once it exists. Openbox has no autostart of its own by default, so this rides
  # along in the session file's environment instead.
  cat > "$USER_HOME/.config/openbox/autostart" <<'OBSTART'
# Pull the adris OS window fullscreen as soon as the window manager sees it.
(
  for i in $(seq 1 40); do
    WID=$(wmctrl -l 2>/dev/null | grep -iE 'adris OS|Blank page' | head -1 | awk '{print $1}')
    if [ -n "$WID" ]; then
      wmctrl -i -r "$WID" -b add,fullscreen
      break
    fi
    sleep 1
  done
) &
OBSTART
  chmod +x "$USER_HOME/.config/openbox/autostart"

  echo "Session set to: adris OS (takes over the whole screen)"
  echo "Nothing else runs behind it — no panel, no desktop, no icons."
else
  echo "xfce4-session" > "$USER_HOME/.xsession"
  echo "Session set to: the ordinary Ubuntu (XFCE) desktop"
fi

chown -R "$DESKTOP_USER:$DESKTOP_USER" "$USER_HOME/.xsession" "$USER_HOME/.config/openbox" 2>/dev/null || true
chmod +x "$USER_HOME/.xsession"

cat <<INFO

Takes effect at the NEXT login — an X session cannot be swapped underneath itself.
Close Remote Desktop, then reconnect to localhost:3390.

Switch back any time:
    wsl -d Ubuntu -u root -e bash $SCRIPT_DIR/set-session.sh $([ "$MODE" = "adris" ] && echo ubuntu || echo adris)
INFO
