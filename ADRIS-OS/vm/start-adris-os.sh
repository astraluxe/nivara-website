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

# ── 2b. The bundled business apps ────────────────────────────────────────────
# Runs once and is cheap afterwards (it skips anything already up). Never fatal: a machine without
# Customer Records is still a working computer, and a half-broken desktop would be far worse than
# one missing feature.
if [ -x "$SCRIPT_DIR/provision.sh" ]; then
  bash "$SCRIPT_DIR/provision.sh" 2>&1 | sed 's/^/  /' || say "· business apps could not be set up — everything else is unaffected"
fi

# ── 3. adris OS opens itself on login ────────────────────────────────────────
# THE POINT OF THIS SCRIPT. An autostart entry means the desktop appears with adris OS already on
# it, fullscreen — rather than a bare XFCE desktop you then have to open a browser inside.
AUTOSTART_DIR="$USER_HOME/.config/autostart"
mkdir -p "$AUTOSTART_DIR"

# ── HOW adris OS IS OPENED, and why it is not "app mode" ─────────────────────
#
# Epiphany has a --application-mode that gives a chromeless window, and it was the obvious choice.
# It does not work here. It has THREE separate hidden requirements — the profile directory must
# exist, its name must start with org.gnome.Epiphany.WebApp_, AND a matching .desktop file must be
# registered with xdg-desktop-portal — and even with all three satisfied it still aborted with
# "trying to access web app settings outside web app mode" and no window ever appeared. Each
# attempt LOOKED like it worked, because the process lives for a second or two before dying, so a
# pgrep check right after launching reports success on a browser that is already gone. (That is
# how "adris OS is running" got said twice about a screen that showed a bare desktop.)
#
# So: launch Epiphany normally, then have the window manager fullscreen it. wmctrl does what app
# mode was supposed to do — no toolbar visible, fills the screen — and it is not fragile. The
# window also has to be pulled onto the CURRENT workspace: XFCE opened it on workspace 3, where it
# was invisible and looked like nothing had launched at all.
ADRIS_URL="http://localhost:5173/"

# The launcher both the autostart entry and the live-session path use. Written once, to a file, so
# there is exactly one definition of "open adris OS" rather than two that drift.
LAUNCHER="$USER_HOME/.local/bin/adris-os-open"
mkdir -p "$USER_HOME/.local/bin"
cat > "$LAUNCHER" <<'LAUNCH'
#!/usr/bin/env bash
# Open adris OS fullscreen on whichever display this session is using.
URL="http://localhost:5173/"

# Wait for the shell to answer. On a cold login the browser otherwise arrives first, shows a
# connection error, and sits there looking exactly like a broken product.
for _ in $(seq 1 45); do
  curl -sf -o /dev/null "$URL" && break
  sleep 1
done

pgrep -f "epiphany.*5173" >/dev/null && exit 0   # already open

setsid epiphany-browser "$URL" >/tmp/adris-epi.log 2>&1 </dev/null &

# Give the window time to exist, then claim it: onto THIS workspace (XFCE has been seen opening it
# on workspace 3, invisible), focused, and fullscreen — which is what app mode was meant to do.
for _ in $(seq 1 25); do
  WID=$(wmctrl -l 2>/dev/null | grep -iE 'adris OS|Blank page' | head -1 | awk '{print $1}')
  [ -n "$WID" ] && break
  sleep 1
done
if [ -n "${WID:-}" ]; then
  wmctrl -i -r "$WID" -t 0
  wmctrl -i -a "$WID"
  sleep 1
  wmctrl -i -r "$WID" -b add,fullscreen
fi
LAUNCH
chmod +x "$LAUNCHER"
chown -R "$DESKTOP_USER:$DESKTOP_USER" "$USER_HOME/.local/bin"

cat > "$AUTOSTART_DIR/adris-os.desktop" <<AUTOSTART
[Desktop Entry]
Type=Application
Name=adris OS
Comment=The adris OS shell, fullscreen
Exec=$LAUNCHER
X-GNOME-Autostart-enabled=true
Terminal=false
AUTOSTART
chown -R "$DESKTOP_USER:$DESKTOP_USER" "$AUTOSTART_DIR"

# A launcher they can click, for when a session is already open (autostart only runs at login).
mkdir -p "$USER_HOME/.local/share/applications" "$USER_HOME/Desktop"
cat > "$USER_HOME/.local/share/applications/adris-os.desktop" <<SHORTCUT
[Desktop Entry]
Type=Application
Name=adris OS
Comment=Open the adris OS desktop shell
Exec=$LAUNCHER
Icon=preferences-desktop-display
Terminal=false
Categories=System;
SHORTCUT
cp "$USER_HOME/.local/share/applications/adris-os.desktop" "$USER_HOME/Desktop/adris-os.desktop"
chmod +x "$USER_HOME/Desktop/adris-os.desktop"
chown -R "$DESKTOP_USER:$DESKTOP_USER" "$USER_HOME/.local/share/applications" "$USER_HOME/Desktop"
say "✓ adris OS set to open automatically on login (and an icon on the desktop)"

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

# ── An already-open session ──────────────────────────────────────────────────
#
# Autostart only fires at LOGIN, so someone already connected sees no change when this runs. The
# obvious fix — launch into their live session from here — was tried and abandoned, for a reason
# worth recording: a GUI app started by root for another user fights dconf, D-Bus and
# xdg-desktop-portal all at once (`unable to create directory /run/user/0/dconf`, `Failed to create
# XdpPortal instance`), and even importing the session's real DISPLAY/DBUS/XDG_RUNTIME_DIR out of
# /proc/<session-pid>/environ did not get a window on screen reliably. The same launcher run from
# inside the session works every time.
#
# So the honest answer is not to launch from root at all: log in (autostart handles it), or use the
# "adris OS" icon on the desktop / in the applications menu, which runs in-session where it works.
if pgrep -u "$DESKTOP_USER" -x xfce4-session >/dev/null 2>&1; then
  say "· a desktop session is already open — log out and back in, or use the"
  say "  \"adris OS\" icon on its desktop (autostart only runs at login)"
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
