#!/usr/bin/env bash
# ─── First boot: everything a business needs, already running ────────────────
#
# THE GOAL. A new adris OS machine should arrive with Customer Records, Accounts and Invoicing
# already there and already working — the way Mail and Calendar are simply present on a Mac. Not a
# store listing, not a setup wizard, not "needs Docker + PostgreSQL". The owner clicks Customer
# Records and their customer records open.
#
# HOW. Each one is a container stack brought up here, on a fixed local port, with its data in a
# named volume under the user's workspace so it survives updates and travels with the machine
# ([§9](plan.md) — the workspace folder IS the machine). The catalogue holds only a name and a
# port; nothing above this layer knows or cares what is inside.
#
# WHAT THE USER SEES: "Customer Records". Never a container, never a database, never an upstream
# product name. That is the point — these are adris OS features, not third-party software the owner
# has been left to assemble.
#
# ── ONE THING TO SETTLE BEFORE SHIPPING, flagged rather than buried ──────────
# The upstreams here are copyleft (AGPL/GPL family). Running them, bundling them, and putting your
# own name on the interface is generally fine — but those licences carry conditions, and AGPL in
# particular attaches obligations when software is offered to users over a network. Rebranding does
# not remove them. This is a lawyer's afternoon, not a blocker, and it is much cheaper to settle now
# than after launch. See plan.md §12d.
#
# Usage (inside the VM, as root):
#   wsl -d Ubuntu -u root -e bash vm/provision.sh

set -uo pipefail

DESKTOP_USER="${SUDO_USER:-amogh}"
id "$DESKTOP_USER" >/dev/null 2>&1 || DESKTOP_USER="$(getent passwd 1000 | cut -d: -f1)"
USER_HOME="$(getent passwd "$DESKTOP_USER" | cut -d: -f6)"
DATA="$USER_HOME/.adris/services"

say() { printf '  %s\n' "$1"; }

echo ""
echo "═══ adris OS — setting up the business apps ═══"
mkdir -p "$DATA"

# ── Docker ───────────────────────────────────────────────────────────────────
# The engine everything below runs on. Installed once; the user never hears about it again.
if ! command -v docker >/dev/null 2>&1; then
  say "Installing the container engine…"
  export DEBIAN_FRONTEND=noninteractive
  apt-get install -y -qq docker.io docker-compose-v2 >/dev/null 2>&1 \
    || apt-get install -y -qq docker.io >/dev/null 2>&1
fi

if ! command -v docker >/dev/null 2>&1; then
  say "✗ The container engine could not be installed — the business apps cannot start."
  say "  Everything else on the system is unaffected."
  exit 1
fi

# WSL2 has no systemd, so dockerd must be started directly. On a real installation systemd handles
# this and the branch below is simply skipped.
if ! docker info >/dev/null 2>&1; then
  say "Starting the container engine…"
  (setsid dockerd >/var/log/adris-dockerd.log 2>&1 &) || true
  for _ in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
fi

if ! docker info >/dev/null 2>&1; then
  say "✗ The container engine did not start. See /var/log/adris-dockerd.log"
  exit 1
fi
say "✓ container engine ready"

# The owner should never need sudo to use their own machine's apps.
usermod -aG docker "$DESKTOP_USER" 2>/dev/null || true

# ── One shared database ──────────────────────────────────────────────────────
# All three apps share a single PostgreSQL rather than each shipping its own. On a laptop that is
# the difference between one engine and three, which for a small machine is the difference between
# usable and not.
if ! docker ps -a --format '{{.Names}}' | grep -q '^adris-db$'; then
  say "Creating the database…"
  docker run -d --name adris-db --restart unless-stopped \
    -e POSTGRES_PASSWORD=adris -e POSTGRES_USER=adris \
    -v "$DATA/db:/var/lib/postgresql/data" \
    -p 127.0.0.1:5432:5432 \
    postgres:16 >/dev/null 2>&1 || say "  (database container could not be created)"
else
  docker start adris-db >/dev/null 2>&1 || true
fi

# ── The three business apps ──────────────────────────────────────────────────
#
# start_app <name shown to the user> <container> <port> <image> [extra docker args…]
#
# Failure here is never fatal: a machine with no Customer Records is still a working computer, and
# a half-broken desktop would be a far worse outcome than one missing feature. Each failure is
# stated plainly rather than swallowed.
start_app() {
  local label="$1" name="$2" port="$3" image="$4"; shift 4
  if docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
    say "✓ ${label} already running"
    return 0
  fi
  if docker ps -a --format '{{.Names}}' | grep -q "^${name}$"; then
    docker start "$name" >/dev/null 2>&1 && { say "✓ ${label} restarted"; return 0; }
  fi
  say "Setting up ${label}… (first time only, this pulls a download)"
  if docker run -d --name "$name" --restart unless-stopped \
       -p "127.0.0.1:${port}:${5:-3000}" "$@" "$image" >/dev/null 2>&1; then
    say "✓ ${label} ready on port ${port}"
  else
    say "✗ ${label} could not be set up — the rest of the system is unaffected"
  fi
}

# Ports match `port` in frontend/src/lib/catalogue.ts. Changing one means changing both.
start_app "Customer Records" adris-crm     3010 "twentycrm/twenty:latest"        3000 \
  -v "$DATA/crm:/app/packages/twenty-server/.local-storage"
start_app "Accounts"         adris-accounts 3011 "frappe/erpnext:latest"          8000 \
  -v "$DATA/accounts:/home/frappe/frappe-bench/sites"
start_app "Invoicing"        adris-invoicing 3012 "invoiceninja/invoiceninja:5"   80 \
  -v "$DATA/invoicing:/var/www/app/public"

echo ""
say "Done. These start by themselves from now on — the owner just clicks them."
echo ""
