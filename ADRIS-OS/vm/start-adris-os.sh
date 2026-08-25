#!/usr/bin/env bash
# ─── ONE command. adris OS, running, on screen. ──────────────────────────────
#
# Everything before this needed a sequence: start the desktop, connect, open a browser, type a
# URL. That is not an operating system, that is a demo with homework. This does the lot and makes
# adris OS the thing you SEE when the desktop appears — not something you go and find.
#
# What it does, in order:
#   1. starts xrdp (the desktop server) if it isn't up
#   2. starts the agent bridge and the adris OS shell if they aren't up
#   3. writes an XFCE autostart entry so adris OS opens FULLSCREEN the moment you log in
#   4. sets the desktop wallpaper to the adris wallpaper, so even the moment before the shell
#      paints looks like the product rather than a stock Linux background
#   5. hides XFCE's own desktop icons, so nothing sits on top of the wallpaper
#
# Run it from Windows via START-ADRIS-OS.bat (which also opens Remote Desktop for you), or:
#   wsl -d Ubuntu -u root -e bash /mnt/c/.../ADRIS-OS/vm/start-adris-os.sh

set -uo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root (xrdp binds a port and switches user):"
  echo "  wsl -d Ubuntu -u root -e bash $0"
  exit 1
fi

DESKTOP_USER="${SUDO_USER:-amogh}"
id "$DESKTOP_USER" >/dev/null 2>&1 || DESKTOP_USER="$(getent passwd 1000 | cut -d: -f1)"
USER_HOME="$(getent passwd "$DESKTOP_USER" | cut -d: -f6)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

say() { printf '  %s\n' "$1"; }

echo ""
echo "═══ starting adris OS ═══"

# ── 1. the desktop server ────────────────────────────────────────────────────
if pgrep -x xrdp >/dev/null; then
  say "✓ desktop server already running"
else
  echo "xfce4-session" > "$USER_HOME/.xsession"
  chown "$DESKTOP_USER:$DESKTOP_USER" "$USER_HOME/.xsession"
  sed -i 's/^port=3389/port=3390/' /etc/xrdp/xrdp.ini 2>/dev/null || true
  adduser xrdp ssl-cert >/dev/null 2>&1 || true
  /usr/sbin/xrdp-sesman >/dev/null 2>&1
  /usr/sbin/xrdp >/dev/null 2>&1
  sleep 2
  pgrep -x xrdp >/dev/null && say "✓ desktop server started" || { say "✗ xrdp failed — see /var/log/xrdp.log"; exit 1; }
fi

# ── 2. the adris OS services ─────────────────────────────────────────────────
# Started with setsid so they outlive this script and whatever shell invoked it. Without that they
# die the moment the wsl command returns, which is exactly how a "running" service ends up as a
# process husk that answers nothing.
if curl -sf -m 2 -o /dev/null http://localhost:7717/health 2>/dev/null; then
  say "✓ agent bridge already running"
else
  su - "$DESKTOP_USER" -c "cd ~ && setsid node '$SCRIPT_DIR/agent-bridge.mjs' > ~/adris-bridge.log 2>&1 < /dev/null &"
  sleep 3
  curl -sf -m 3 -o /dev/null http://localhost:7717/health 2>/dev/null \
    && say "✓ agent bridge started" || say "✗ agent bridge did not come up — see ~/adris-bridge.log"
fi

if curl -sf -m 2 -o /dev/null http://localhost:5173/ 2>/dev/null; then
  say "✓ adris OS shell already running"
else
  su - "$DESKTOP_USER" -c "cd ~/adris-os-frontend && setsid npm run dev > ~/adris-vite.log 2>&1 < /dev/null &"
  for _ in $(seq 1 30); do
    curl -sf -m 2 -o /dev/null http://localhost:5173/ 2>/dev/null && break
    sleep 1
  done
  curl -sf -m 3 -o /dev/null http://localhost:5173/ 2>/dev/null \
    && say "✓ adris OS shell started" || say "✗ shell did not come up — see ~/adris-vite.log"
fi

# ── 3. adris OS opens itself on login ────────────────────────────────────────
# THE POINT OF THIS SCRIPT. An autostart entry means the desktop appears with adris OS already on
# it, fullscreen — rather than a bare XFCE desktop you then have to open a browser inside.
AUTOSTART_DIR="$USER_HOME/.config/autostart"
mkdir -p "$AUTOSTART_DIR"

# Epiphany refuses --application-mode unless this directory exists AND its name starts with
# org.gnome.Epiphany.WebApp_ (it derives the app id from the name). Both rules found the hard way.
EPI_PROFILE="$USER_HOME/.local/share/epiphany/org.gnome.Epiphany.WebApp_adrisos"
mkdir -p "$EPI_PROFILE"

# A short wait, then launch: on a cold login the shell may still be binding its port, and a browser
# that arrives first shows a connection error and stays there.
cat > "$AUTOSTART_DIR/adris-os.desktop" <<AUTOSTART
[Desktop Entry]
Type=Application
Name=adris OS
Comment=The adris OS shell, fullscreen
Exec=bash -c 'for i in \$(seq 1 40); do curl -sf -o /dev/null http://localhost:5173/ && break; sleep 1; done; epiphany-browser -a --profile=$EPI_PROFILE http://localhost:5173/'
X-GNOME-Autostart-enabled=true
Terminal=false
AUTOSTART

chown -R "$DESKTOP_USER:$DESKTOP_USER" "$AUTOSTART_DIR" "$USER_HOME/.local/share/epiphany" 2>/dev/null || true
say "✓ adris OS set to open automatically on login"

# ── 4 & 5. make the desktop itself look like the product ─────────────────────
# xfconf needs a running session bus to talk to, so this is written into the session startup rather
# than executed now — running it here would fail on a desktop that has not started yet.
WALL="$USER_HOME/adris-os-frontend/public/wallpapers/purple-mountain.png"
if [ -f "$WALL" ]; then
  cat > "$AUTOSTART_DIR/adris-look.desktop" <<LOOK
[Desktop Entry]
Type=Application
Name=adris OS look
Comment=Wallpaper and a clean desktop, applied at session start
Exec=bash -c 'sleep 3; for p in \$(xfconf-query -c xfce4-desktop -l 2>/dev/null | grep last-image); do xfconf-query -c xfce4-desktop -p "\$p" -s "$WALL"; done; xfconf-query -c xfce4-desktop -p /desktop-icons/style -s 0'
X-GNOME-Autostart-enabled=true
Terminal=false
LOOK
  chown "$DESKTOP_USER:$DESKTOP_USER" "$AUTOSTART_DIR/adris-look.desktop"
  say "✓ wallpaper and clean desktop set for login"
else
  say "· wallpaper not found in the VM copy — skipped"
fi

cat <<INFO

═══════════════════════════════════════════════════════════════
  adris OS is ready.

  Connect Windows Remote Desktop to:   localhost:3390
      Username:  $DESKTOP_USER

  adris OS opens by itself, fullscreen, as soon as you log in.
  Nothing to click, no URL to type.

  To leave adris OS and use the plain Ubuntu desktop underneath,
  press F11 (leave fullscreen) or close the window.
═══════════════════════════════════════════════════════════════

INFO
