#!/usr/bin/env bash
# ─── Run adris OS in the VM: the shell AND the real Linux underneath ─────────
#
# Two processes, together, because either alone is only half the thing:
#   1. the agent bridge (agent-bridge.mjs) — launches real applications, and is the same surface an
#      agent uses to drive them
#   2. the shell (Vite dev server) — the adris OS UI
#
# Then open http://localhost:5173 from Windows. Clicking LibreOffice in the dock opens the REAL
# LibreOffice, in its own window, through WSLg.
#
# Usage (from Windows):
#   MSYS_NO_PATHCONV=1 wsl -d Ubuntu -e bash -lc "bash /mnt/c/.../ADRIS-OS/vm/run-os.sh"
#
# Ctrl-C stops both.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$HERE/../frontend"
VM_DIR="$HOME/adris-os-frontend"

echo "── adris OS — starting inside the VM ──"
echo "Ubuntu: $(lsb_release -ds 2>/dev/null || echo unknown)"
echo "Display: ${DISPLAY:-none} / Wayland: ${WAYLAND_DISPLAY:-none}"
if [ -z "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]; then
  echo "  ⚠ No display — the UI will still run, but real apps will have nowhere to open."
fi
echo ""

# Same copy-then-install as run-in-wsl.sh — node_modules can't be shared across the Windows/Linux
# boundary (native binaries), so the VM keeps its own.
mkdir -p "$VM_DIR"
rsync -a --delete --exclude node_modules --exclude dist "$SRC_DIR/" "$VM_DIR/"
cd "$VM_DIR"
[ -d node_modules ] || npm install --no-audit --no-fund

# 1. the bridge
echo "→ starting the app bridge on :7717"
node "$HERE/agent-bridge.mjs" &
BRIDGE_PID=$!

# Both die together — a shell with no bridge is a dock whose buttons all fail.
trap 'echo ""; echo "stopping…"; kill $BRIDGE_PID 2>/dev/null || true' EXIT INT TERM

sleep 1
echo "→ starting the shell on :5173"
echo ""
echo "   Open http://localhost:5173 from Windows."
echo ""
npm run dev
