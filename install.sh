#!/usr/bin/env bash
set -e

VERSION="1.0.57"
BASE="https://github.com/astraluxe/nivara-desktop/releases/latest/download"
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
  sudo dpkg -i "$TMP/adris.deb"
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
