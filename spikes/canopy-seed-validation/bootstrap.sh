#!/usr/bin/env bash
set -euo pipefail

UPSTREAM_URL="https://github.com/FluidWorksApp/canopy-ide.git"
PINNED_SHA="25c14a3dba5f656b58817993bc6587f499bebd9b"
VALIDATION_HOME="${PANE_VALIDATION_HOME:-$HOME/.pane-validation}"
CHECKOUT="$VALIDATION_HOME/canopy-ide"

mkdir -p "$VALIDATION_HOME"

if [ -d "$CHECKOUT/.git" ]; then
  printf 'Using existing checkout: %s\n' "$CHECKOUT"
  git -C "$CHECKOUT" remote get-url origin >/dev/null 2>&1 || {
    printf 'ERROR: existing checkout has no origin remote\n' >&2
    exit 1
  }
  origin_url="$(git -C "$CHECKOUT" remote get-url origin)"
  if [ "$origin_url" != "$UPSTREAM_URL" ] && [ "$origin_url" != "git@github.com:FluidWorksApp/canopy-ide.git" ]; then
    printf 'ERROR: existing checkout origin is not FluidWorksApp/canopy-ide: %s\n' "$origin_url" >&2
    exit 1
  fi
else
  if [ -e "$CHECKOUT" ]; then
    printf 'ERROR: %s exists but is not a Git checkout\n' "$CHECKOUT" >&2
    exit 1
  fi
  printf 'Cloning Canopy into %s\n' "$CHECKOUT"
  git clone "$UPSTREAM_URL" "$CHECKOUT"
fi

printf 'Fetching pinned commit %s\n' "$PINNED_SHA"
git -C "$CHECKOUT" fetch --no-tags origin "$PINNED_SHA"
git -C "$CHECKOUT" checkout --detach "$PINNED_SHA"

head_sha="$(git -C "$CHECKOUT" rev-parse HEAD)"
if [ "$head_sha" != "$PINNED_SHA" ]; then
  printf 'ERROR: expected HEAD %s, got %s\n' "$PINNED_SHA" "$head_sha" >&2
  exit 1
fi

if [ -n "$(git -C "$CHECKOUT" status --porcelain)" ]; then
  printf 'ERROR: pinned checkout is not clean. Baseline validation must start clean.\n' >&2
  git -C "$CHECKOUT" status --short >&2
  exit 1
fi

printf '\nCanopy baseline ready.\n'
printf 'Path: %s\n' "$CHECKOUT"
printf 'HEAD: %s\n' "$head_sha"
printf '\nNext:\n'
printf '  cd %q\n' "$CHECKOUT"
printf '  npm install\n'
printf '  npm run typecheck\n'
printf '  npm run test\n'
printf '  npm run build\n'
printf '  npm run tauri:dev\n'
