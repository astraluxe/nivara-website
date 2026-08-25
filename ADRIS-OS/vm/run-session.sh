#!/usr/bin/env bash
# ─── adris OS as an actual desktop session, not a browser tab ────────────────
#
# run-os.sh serves the shell and you look at it in a browser window on Windows. That proves the
# code works, but it doesn't LOOK like an operating system — it looks like a web page, because
# that's what you're seeing.
#
# This runs the shell fullscreen INSIDE the VM, with no browser chrome at all: no address bar, no
# tabs, no window title. On screen it is just the adris OS desktop, and real applications launched
# from its dock (LibreOffice, Files, a terminal) open as real windows beside it — which is exactly
# what the finished product is, minus the compositor work from plan.md §11 that makes the rail a
# true layer-shell panel rather than part of the page.
#
# Needs a browser in the VM. Chromium is used because its kiosk mode is the cleanest, and because
# `--app=` gives a genuinely chrome-less window rather than a fullscreen tab.
#
# Usage (from Windows):
#   MSYS_NO_PATHCONV=1 wsl -d Ubuntu -e bash -lc "bash /mnt/c/.../ADRIS-OS/vm/run-session.sh"

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$HERE/../frontend"
VM_DIR="$HOME/adris-os-frontend"

if [ -z "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]; then
  echo "No display available — a desktop session has nowhere to appear."
  echo "Run this from a WSLg-enabled shell (Windows 11 WSL2 has it by default)."
  exit 1
fi

# The browser is the one thing this script can't do without.
# WHY EPIPHANY IS FIRST, not Chromium: on Ubuntu 24.04 both `chromium-browser` and `firefox` are
# snap wrappers, and snap does not work under WSL2 (no systemd). Installing either gets you a
# package that cannot start. epiphany-browser (GNOME Web) is a real .deb and runs fine — so it is
# the default here, with Chromium kept ahead of nothing in case this ever runs on a real Ubuntu
# install where the deb is genuine.
BROWSER=""
for cand in epiphany-browser chromium chromium-browser google-chrome falkon; do
  if command -v "$cand" >/dev/null 2>&1; then BROWSER="$cand"; break; fi
done
if [ -z "$BROWSER" ]; then
  echo "No browser in the VM yet. Install one first:"
  echo "    sudo apt-get install -y epiphany-browser"
  echo "(or run vm/setup-desktop.sh, which installs it along with everything else)"
  exit 1
fi

echo "── adris OS session ──"
echo "Ubuntu:  $(lsb_release -ds 2>/dev/null || echo unknown)"
echo "Browser: $BROWSER"
echo "Display: ${WAYLAND_DISPLAY:-$DISPLAY}"
echo ""

mkdir -p "$VM_DIR"
rsync -a --delete --exclude node_modules --exclude dist "$SRC_DIR/" "$VM_DIR/"
cd "$VM_DIR"
[ -d node_modules ] || npm install --no-audit --no-fund

# 1. the app bridge — without it the dock's buttons can't launch anything
node "$HERE/agent-bridge.mjs" &
BRIDGE_PID=$!

# 2. the shell
npm run dev > /tmp/adris-vite.log 2>&1 &
VITE_PID=$!

cleanup() {
  echo ""
  echo "closing the session…"
  kill $BRIDGE_PID $VITE_PID $BROWSER_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Wait for the server to actually answer before opening a window at it — otherwise the session
# opens on a connection-refused page and looks broken when it isn't.
echo -n "waiting for the shell to come up"
for _ in $(seq 1 60); do
  if curl -sf -o /dev/null http://localhost:5173/; then break; fi
  echo -n "."
  sleep 0.5
done
echo " ready."

# Each browser has its own way of saying "no chrome, just the page" — there is no common flag.
case "$BROWSER" in
  epiphany-browser)
    # -a = application mode: no address bar, no tabs — the window is just the page.
    #
    # THE PROFILE PATH IS NOT FREE-FORM. Epiphany refuses --application-mode unless the profile
    # directory already exists AND its name starts with `org.gnome.Epiphany.WebApp_` — it derives
    # the GApplication ID from that name and hard-errors otherwise. Both rules were found the hard
    # way: an arbitrary path fails with "must be an existing directory", and creating it under the
    # wrong name then fails with "Failed to get GApplication ID".
    EPI_PROFILE="$HOME/.local/share/epiphany/org.gnome.Epiphany.WebApp_adrisos"
    mkdir -p "$EPI_PROFILE"
    "$BROWSER" -a --profile="$EPI_PROFILE" http://localhost:5173/ \
      >/tmp/adris-browser.log 2>&1 &
    ;;
  falkon)
    "$BROWSER" --no-extensions --profile=adris-os http://localhost:5173/ \
      >/tmp/adris-browser.log 2>&1 &
    ;;
  *)
    "$BROWSER" \
      --app=http://localhost:5173/ \
      --start-fullscreen \
      --no-first-run \
      --no-default-browser-check \
      --disable-features=Translate,TranslateUI \
      --user-data-dir="$HOME/.adris-os-session" \
      >/tmp/adris-browser.log 2>&1 &
    ;;
esac
BROWSER_PID=$!

echo ""
echo "adris OS is running. The window on screen IS the desktop."
echo "Close that window, or press Ctrl-C here, to end the session."
wait $BROWSER_PID
