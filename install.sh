#!/usr/bin/env bash
set -e

# adris.tech Linux installer.
# Linux builds are published under v<version>-linux release tags. That tag is never GitHub's
# "latest" (the latest slot belongs to the Windows release), so we resolve the newest
# v*-linux tag from the GitHub API automatically — and fall back to a pinned version if the
# API can't be reached. This keeps `curl … | sh` pointing at the right release every time.
FALLBACK_VERSION="1.0.97"
REPO="astraluxe/nivara-desktop"

TAG=$(curl -fsSL "https://api.github.com/repos/$REPO/releases?per_page=30" 2>/dev/null \
        | grep -oE '"tag_name": *"v[0-9.]+-linux"' \
        | grep -oE 'v[0-9.]+-linux' \
        | head -n1)
if [ -z "$TAG" ]; then TAG="v${FALLBACK_VERSION}-linux"; fi
VERSION="${TAG#v}"; VERSION="${VERSION%-linux}"

BASE="https://github.com/$REPO/releases/download/$TAG"
DEB_URL="$BASE/adris-setup-linux-$VERSION.deb"
APPIMAGE_URL="$BASE/adris-setup-linux-$VERSION.AppImage"

echo ""
echo "adris.tech installer — v$VERSION"
echo "─────────────────────────────────"

if command -v apt-get &>/dev/null; then
  echo "Detected Debian/Ubuntu — downloading .deb..."
  TMP=$(mktemp -d)
  curl -fsSL --progress-bar "$DEB_URL" -o "$TMP/adris.deb"
  echo "Installing..."
  sudo dpkg -i "$TMP/adris.deb" || sudo apt-get install -f -y
  rm -rf "$TMP"
  echo ""
  echo "Done! Open adris.tech from your application launcher."
else
  echo "Using AppImage (works on Arch, Fedora, and any distro)..."
  mkdir -p "$HOME/Applications"
  curl -fsSL --progress-bar "$APPIMAGE_URL" -o "$HOME/Applications/adris.AppImage"
  chmod +x "$HOME/Applications/adris.AppImage"
  echo ""
  echo "Done! Run: $HOME/Applications/adris.AppImage"
  echo "Or double-click it in your file manager."
fi
