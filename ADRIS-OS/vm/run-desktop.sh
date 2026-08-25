#!/usr/bin/env bash
# ─── adris OS as a WHOLE DESKTOP — a second computer, not windows on Windows ──
#
# THE PROBLEM THIS SOLVES. WSLg (what run-session.sh uses) draws each Linux window directly onto
# the Windows desktop. That is genuinely useful, but it is not an operating system you can look at:
# LibreOffice appears as one more window among your Windows windows, there is no Ubuntu desktop
# behind it, no panel, no wallpaper — nothing that reads as "a different computer."
#
# This runs a real desktop environment (XFCE) inside the VM and serves it over RDP. Windows already
# has a Remote Desktop client built in, so you connect to it and get a complete Ubuntu desktop in
# its own window — its own wallpaper, its own panel, its own windows inside it. That is the "second
# computer on my screen" experience, and it is also much closer to what a booted adris OS will
# actually be.
#
# WHY NOT systemd. WSL2 does not run systemd by default, so `systemctl start xrdp` does nothing.
# Everything here is started directly instead, which is why this script exists rather than a line
# of documentation saying "just enable xrdp."
#
# Usage (from Windows):
#   wsl -d Ubuntu -u root -e bash /mnt/c/.../ADRIS-OS/vm/run-desktop.sh
# then connect Windows Remote Desktop (mstsc) to:  localhost:3390

set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this as root — xrdp binds a port and switches user:"
  echo "  wsl -d Ubuntu -u root -e bash $0"
  exit 1
fi

# The account the desktop session actually runs as. Not root: a desktop running as root is both bad
# practice and visibly wrong (XFCE warns about it), and the user's own files live under their home.
DESKTOP_USER="${SUDO_USER:-amogh}"
if ! id "$DESKTOP_USER" >/dev/null 2>&1; then
  DESKTOP_USER="$(getent passwd 1000 | cut -d: -f1)"
fi
USER_HOME="$(getent passwd "$DESKTOP_USER" | cut -d: -f6)"

echo "── adris OS — full desktop session ──"
echo "Ubuntu:  $(lsb_release -ds 2>/dev/null || echo unknown)"
echo "User:    $DESKTOP_USER  ($USER_HOME)"

for pkg in xrdp xfce4; do
  if ! dpkg -l "$pkg" 2>/dev/null | grep -q '^ii'; then
    echo "  ✗ $pkg is not installed. Run: apt-get install -y xfce4 xfce4-goodies xrdp dbus-x11"
    exit 1
  fi
done

# ── Tell xrdp to start XFCE ──────────────────────────────────────────────────
# Without this it starts whatever default session it can find and usually lands on a grey screen —
# the single most common "xrdp connects but there's nothing there" cause.
echo "xfce4-session" > "$USER_HOME/.xsession"
chown "$DESKTOP_USER:$DESKTOP_USER" "$USER_HOME/.xsession"

# ── Port 3390, not 3389 ──────────────────────────────────────────────────────
# WSL2 forwards localhost to Windows, and Windows' own Remote Desktop *service* may already hold
# 3389 on the host. Using 3390 sidesteps a conflict that otherwise shows up as a connection that
# opens and immediately closes.
sed -i 's/^port=3389/port=3390/' /etc/xrdp/xrdp.ini

# xrdp needs its own key/cert to be readable by the xrdp user; a fresh install occasionally leaves
# this wrong, and the failure mode is a login screen that rejects every password.
adduser xrdp ssl-cert >/dev/null 2>&1 || true

# ── Start the services directly (no systemd here) ────────────────────────────
pkill -x xrdp 2>/dev/null || true
pkill -x xrdp-sesman 2>/dev/null || true
sleep 1
/usr/sbin/xrdp-sesman
/usr/sbin/xrdp

sleep 2
if ! pgrep -x xrdp >/dev/null; then
  echo "  ✗ xrdp did not start. Check /var/log/xrdp.log"
  exit 1
fi

# ── The adris OS services, so the shell is there when the desktop comes up ───
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if ! curl -sf -m 2 -o /dev/null http://localhost:7717/health 2>/dev/null; then
  su - "$DESKTOP_USER" -c "cd ~ && setsid node '$SCRIPT_DIR/agent-bridge.mjs' >~/adris-bridge.log 2>&1 </dev/null &" || true
fi
if ! curl -sf -m 2 -o /dev/null http://localhost:5173/ 2>/dev/null; then
  su - "$DESKTOP_USER" -c "cd ~/adris-os-frontend 2>/dev/null && setsid npm run dev >~/adris-vite.log 2>&1 </dev/null &" || true
fi

cat <<INFO

═══════════════════════════════════════════════════════════════
  adris OS desktop is ready.

  On Windows, open Remote Desktop and connect to:

      localhost:3390

  (Press the Windows key, type "Remote Desktop Connection".)

  Log in with:
      Username:  $DESKTOP_USER
      Password:  your Ubuntu password

  You'll get a full Ubuntu desktop — its own wallpaper, panel and
  windows. Everything installed is in the applications menu, and
  adris OS itself is at http://localhost:5173 inside it.
═══════════════════════════════════════════════════════════════

INFO
