#!/usr/bin/env bash
# ─── What's installed, what's still coming, and what's running ───────────────
#
# Written so progress can be checked directly instead of having to ask. Safe to run any time — it
# only reads, and it never touches apt's lock, so it cannot interfere with an install in flight.
#
# Usage (from Windows):
#   wsl -d Ubuntu -e bash /mnt/c/Users/amogh/OneDrive/Desktop/NIVARA/ADRIS-OS/vm/status.sh
#
# Add `watch` for a live view that refreshes every 2 seconds:
#   wsl -d Ubuntu -e watch -n 2 bash /mnt/c/.../ADRIS-OS/vm/status.sh

echo "═══ adris OS — VM status ═══"
echo "$(lsb_release -ds 2>/dev/null || echo 'Ubuntu')   $(date '+%H:%M:%S')"
echo ""

# ── The applications the dock and rail expect ──
echo "APPS"
apps_ready=0
apps_total=0
for entry in \
  "xterm|Terminal" \
  "libreoffice|LibreOffice (Writer/Calc/Impress)" \
  "nautilus|Files" \
  "gedit|Text Editor" \
  "epiphany-browser|Browser (for the fullscreen session)"
do
  bin="${entry%%|*}"; label="${entry##*|}"
  apps_total=$((apps_total + 1))
  if command -v "$bin" >/dev/null 2>&1; then
    printf '  \033[32m✓\033[0m %-42s %s\n' "$label" "$(command -v "$bin")"
    apps_ready=$((apps_ready + 1))
  else
    printf '  \033[33m·\033[0m %-42s not installed yet\n' "$label"
  fi
done
echo "  ── $apps_ready of $apps_total ready"
echo ""

# ── Is an install actually running right now? ──
echo "INSTALL"
if pgrep -x apt-get >/dev/null || pgrep -x dpkg >/dev/null; then
  echo -e "  \033[36m●\033[0m running"
  # The most recent lines apt has written — this is the live download/unpack progress.
  last="$(sudo -n tail -4 /var/log/apt/term.log 2>/dev/null || tail -4 /var/log/apt/term.log 2>/dev/null)"
  if [ -n "$last" ]; then
    echo "$last" | sed 's/^/    /'
  else
    echo "    (log not readable without root — run with: wsl -d Ubuntu -u root -e bash <this script>)"
  fi
else
  echo "  idle — nothing installing"
  # When idle, the last thing dpkg finished is the useful signal.
  tail -1 /var/log/dpkg.log 2>/dev/null | sed 's/^/    last: /'
fi
echo ""

# ── The two adris OS services ──
echo "SERVICES"
if curl -sf -m 2 -o /dev/null http://localhost:5173/ 2>/dev/null; then
  echo -e "  \033[32m✓\033[0m shell        http://localhost:5173"
else
  echo -e "  \033[33m·\033[0m shell        not running  (vm/run-os.sh)"
fi
if curl -sf -m 2 -o /dev/null http://localhost:7717/health 2>/dev/null; then
  echo -e "  \033[32m✓\033[0m app bridge   http://localhost:7717"
else
  echo -e "  \033[33m·\033[0m app bridge   not running  (node vm/agent-bridge.mjs)"
fi
echo ""

# ── Can windows actually appear? ──
if [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]; then
  echo -e "DISPLAY  \033[32m✓\033[0m ${WAYLAND_DISPLAY:-$DISPLAY}  — GUI apps can open"
else
  echo -e "DISPLAY  \033[31m✗\033[0m none — GUI apps have nowhere to open"
fi

if [ "$apps_ready" -eq "$apps_total" ]; then
  echo ""
  echo "Everything's in. Start the desktop with:  bash vm/run-session.sh"
fi
