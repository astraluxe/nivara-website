#!/usr/bin/env bash
# Re-sync ADRIS-OS/frontend/ into the running VM copy after an edit. The dev server started by
# run-in-wsl.sh keeps running and Vite's own file-watcher picks the change up (hot reload) — this
# just needs to run again whenever the source changes, since the VM has its own copy (see
# run-in-wsl.sh for why: native binaries in node_modules don't cross the Windows/Linux boundary).
#
# Usage (from Windows): MSYS_NO_PATHCONV=1 wsl -d Ubuntu -e bash -lc "bash /mnt/c/.../ADRIS-OS/vm/sync-to-wsl.sh"
set -euo pipefail
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../frontend" && pwd)"
rsync -a --delete --exclude node_modules --exclude dist "$SRC_DIR/" "$HOME/adris-os-frontend/"
echo "synced — the running dev server will hot-reload"
