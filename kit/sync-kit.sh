#!/usr/bin/env bash
# ============================================================================
# STARSTUCK LAB KIT · sync
# Copies the shared CSS (tokens.css + base.css) from this canonical kit/ dir
# into each spoke repo. Spokes VENDOR a committed copy so they stay zero-build
# and offline-capable — no runtime dependency on the hub.
#
# Run from anywhere:  bash kit/sync-kit.sh
# ============================================================================
set -euo pipefail

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GH_ROOT="$(cd "$KIT_DIR/../.." && pwd)"   # ~/Documents/GitHub

sync_one() {
  local repo_dir="$1" target="$2"
  if [ ! -d "$repo_dir" ]; then
    echo "skip: $(basename "$repo_dir") not found"
    return
  fi
  mkdir -p "$target"
  cp "$KIT_DIR/tokens.css" "$KIT_DIR/base.css" "$target/"
  echo "synced → ${target#$GH_ROOT/}"
}

sync_one "$GH_ROOT/jigawatt"    "$GH_ROOT/jigawatt/docs/assets/kit"
sync_one "$GH_ROOT/lokki"       "$GH_ROOT/lokki/site/assets/kit"
sync_one "$GH_ROOT/clear-skies" "$GH_ROOT/clear-skies/kit"

echo
echo "done."
echo "note: clear-skies takes tokens.css ONLY, and you must add kit/*.css to"
echo "      its service-worker precache list or it won't be available offline."
