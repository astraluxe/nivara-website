#!/usr/bin/env bash
# ─── Run the frontend shell inside an actual Linux VM, not on the host ─────────
#
# WSL2 IS a real lightweight Linux VM — its own kernel, its own filesystem, Hyper-V underneath —
# not a compatibility layer. It's already installed on this machine (Ubuntu), so it's the honest,
# immediately-available answer to "I don't want this installed on my computer" for the frontend as
# it stands today. This is NOT the real adris OS from plan.md §2's day-to-day loop — that is a
# custom-built Fedora image booted in QEMU, and doesn't exist yet (Week 1 Day 3 of the actual OS
# build, a much bigger, later piece of work). This script is for testing the React/TypeScript shell
# in isolation while that doesn't exist yet.
#
# WHY THE PROJECT GETS COPIED, NOT RUN IN PLACE:
# node_modules built on Windows (via the Windows npm) contains WINDOWS-native binaries for rollup
# and esbuild. Running that same node_modules under WSL's Linux Node fails outright — it's looking
# for a Linux binary that was never installed (a real, common cross-platform npm bug: npm/cli#4828).
# Running straight off /mnt/c also makes npm painfully slow, since every file access crosses the
# Windows/Linux filesystem boundary. So this script rsyncs the SOURCE (never node_modules) into the
# VM's own native filesystem and installs fresh there — a completely separate install from the one
# on the Windows side, which is untouched by any of this.
#
# The source of truth stays on Windows (ADRIS-OS/frontend/, edited normally). Re-run this script
# after any edit to pick the change up in the VM — it re-syncs every time, cheaply (rsync only
# copies what changed).
#
# Usage (from Windows, avoiding Git Bash's path mangling):
#   MSYS_NO_PATHCONV=1 wsl -d Ubuntu -e bash -lc "bash /mnt/c/.../ADRIS-OS/vm/run-in-wsl.sh"

set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../frontend" && pwd)"
VM_DIR="$HOME/adris-os-frontend"

echo "── adris OS frontend — running inside WSL2 (Ubuntu), not on the Windows host ──"
node --version

mkdir -p "$VM_DIR"
rsync -a --delete --exclude node_modules --exclude dist "$SRC_DIR/" "$VM_DIR/"
cd "$VM_DIR"

if [ ! -d node_modules ]; then
  echo "First run — installing dependencies inside the VM's own filesystem (this happens once)…"
fi
# Always run install — cheap when nothing changed, and picks up any dependency edit automatically.
npm install --no-audit --no-fund

echo ""
echo "Starting the dev server. Once it says 'ready', open http://localhost:5173 from Windows —"
echo "the page you'll see is served entirely from inside this VM, from a Node install this script"
echo "put there — nothing on the Windows side was touched to make this run."
exec npm run dev
