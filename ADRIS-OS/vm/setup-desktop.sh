#!/usr/bin/env bash
# ─── Install the real Linux applications adris OS ships with ─────────────────
#
# This is the step that makes the VM an actual working computer rather than a browser showing a
# picture of one. Everything here is an ordinary Ubuntu package — the same binaries any Ubuntu user
# has. adris OS launches them; it never reimplements them (plan.md §11, "Why Ubuntu").
#
# Run once, inside the VM:
#   MSYS_NO_PATHCONV=1 wsl -d Ubuntu -e bash -lc "bash /mnt/c/.../ADRIS-OS/vm/setup-desktop.sh"
#
# LibreOffice is a large download (several hundred MB) — that's the bulk of the time.

set -euo pipefail

echo "── adris OS — installing the real Linux applications ──"
echo "Distribution: $(lsb_release -ds 2>/dev/null || echo unknown)"
echo ""

export DEBIAN_FRONTEND=noninteractive

sudo apt-get update -qq

# Small and fast first, so there's something launchable within seconds even if LibreOffice is still
# downloading. xterm doubles as the proof that GUI apps can open at all.
echo "→ core GUI bits (xterm, gedit, nautilus)…"
sudo apt-get install -y -qq xterm gedit nautilus < /dev/null

# epiphany-browser, NOT chromium: on Ubuntu 24.04 chromium-browser and firefox are both snap
# wrappers, and snap does not work under WSL2 (no systemd) — you would install a browser that
# cannot start. Epiphany (GNOME Web) is a real .deb.
echo "→ a browser, so adris OS can run as a real fullscreen session (vm/run-session.sh)…"
sudo apt-get install -y -qq epiphany-browser < /dev/null || \
  echo "  (epiphany-browser unavailable here — run-session.sh will say so if it's missing)"

echo "→ LibreOffice (Writer, Calc, Impress) — this is the big one…"
sudo apt-get install -y -qq libreoffice-writer libreoffice-calc libreoffice-impress < /dev/null

echo ""
echo "── what actually landed ──"
for b in xterm gedit nautilus libreoffice epiphany-browser; do
  if command -v "$b" >/dev/null 2>&1; then
    echo "  ✓ $b   $(command -v "$b")"
  else
    echo "  ✗ $b   NOT INSTALLED"
  fi
done

echo ""
echo "Display: ${DISPLAY:-none} / Wayland: ${WAYLAND_DISPLAY:-none}"
echo ""
echo "Next, either:"
echo "  bash vm/run-session.sh   — adris OS fullscreen, as a real desktop session (what you want to see)"
echo "  bash vm/run-os.sh        — shell + bridge only; view it in a browser on Windows"
