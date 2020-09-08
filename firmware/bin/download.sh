#!/usr/bin/env bash
set -e

SITE="https://firmware.corp.sldev.cz/releases/emulators/"
cd "$(dirname "$0")"

# download all emulators without index files, without directories and only if not present
wget -e robots=off --no-verbose --no-clobber --no-parent --cut-dirs=2 --no-host-directories --recursive --reject "index.html*" $SITE

chmod u+x trezor-emu-*

nix-shell -p autoPatchelfHook SDL2 SDL2_image --run "autoPatchelf trezor-emu-*"

# no need for Mac builds
rm -rf mac
