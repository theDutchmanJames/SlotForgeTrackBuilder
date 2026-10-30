#!/bin/sh
set -eu
SOURCE=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
case "$(uname -s)" in
 Darwin) platform=darwin; default_home="$HOME/Library/Application Support/SlotForgeTrackBuilder" ;;
 Linux) platform=linux; default_home="${XDG_DATA_HOME:-$HOME/.local/share}/SlotForgeTrackBuilder" ;;
 *) echo "Use the Windows installer on Windows."; exit 1 ;;
esac
case "$(uname -m)" in x86_64|amd64) arch=x64 ;; arm64|aarch64) arch=arm64 ;; *) echo "Supported CPUs are x64 and arm64."; exit 1 ;; esac
case "$platform-$arch" in
  darwin-x64) file=node-v24.22.2-darwin-x64.tar.gz; expected=d5e336d588c45be0c37dbd52cc29895593009ca4997a77a1fd02815131ed0e52 ;;
  darwin-arm64) file=node-v24.22.2-darwin-arm64.tar.gz; expected=aa9549349e47dffaa42dcf95d6e06ade8c4bdafc980979883b88767670df385a ;;
  linux-x64) file=node-v24.22.2-linux-x64.tar.gz; expected=361718c444e49af2ca5a110c83ba6a8901143f23ab285ebbef0341f391f482a9 ;;
  linux-arm64) file=node-v24.22.2-linux-arm64.tar.gz; expected=95c264150aceb7f3437a29fd6984924f5f8d1511ea3cbd6c508b83f6c555dae2 ;;
 *) echo "Unsupported platform."; exit 1 ;;
esac
DEST=${SLOTFORGE_HOME:-$default_home}
case "$DEST" in /|"$HOME"|'') echo "Choose a dedicated SlotForge folder."; exit 1 ;; esac
CACHE="$DEST/.setup-cache"
mkdir -p "$CACHE"
ARCHIVE="$CACHE/$file"
if [ ! -f "$ARCHIVE" ]; then
 if [ -f "$SOURCE/installer/runtime-archives/$file" ]; then
  cp "$SOURCE/installer/runtime-archives/$file" "$ARCHIVE"
 else
  echo "Downloading the private Node.js runtime from nodejs.org (first install only)..."
  curl --fail --location --proto '=https' --tlsv1.2 "https://nodejs.org/dist/v24.22.2/$file" --output "$ARCHIVE"
 fi
fi
if command -v sha256sum >/dev/null 2>&1; then actual=$(sha256sum "$ARCHIVE" | cut -d ' ' -f 1); else actual=$(shasum -a 256 "$ARCHIVE" | cut -d ' ' -f 1); fi
if [ "$actual" != "$expected" ]; then echo "Runtime checksum failed. Remove $ARCHIVE and rerun setup."; exit 1; fi
tar -xzf "$ARCHIVE" -C "$CACHE"
NODE="$CACHE/${file%.tar.gz}/bin/node"
if [ "${SLOTFORGE_NO_SHORTCUTS:-0}" = 1 ]; then
 "$NODE" "$SOURCE/installer/install.cjs" --home "$DEST" --no-open --no-shortcuts
else
 "$NODE" "$SOURCE/installer/install.cjs" --home "$DEST" --no-open
fi
if [ "${SLOTFORGE_NO_OPEN:-0}" != 1 ]; then "$DEST/Start SlotForge.sh"; fi
echo "Installed in $DEST"
echo "Your data is in $DEST/data. Keep a backup of that folder."
