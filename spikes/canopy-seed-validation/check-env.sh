#!/usr/bin/env bash
set -euo pipefail

failures=0

pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1"; failures=$((failures + 1)); }
info() { printf 'INFO  %s\n' "$1"; }

if [ "$(uname -s)" = "Darwin" ]; then
  pass "macOS detected ($(sw_vers -productVersion 2>/dev/null || echo unknown), $(uname -m))"
else
  fail "This validation gate targets macOS; detected $(uname -s)"
fi

if xcode-select -p >/dev/null 2>&1; then
  pass "Xcode Command Line Tools: $(xcode-select -p)"
else
  fail "Xcode Command Line Tools missing (install manually with: xcode-select --install)"
fi

require_cmd() {
  if command -v "$1" >/dev/null 2>&1; then
    pass "$1: $(command -v "$1")"
  else
    fail "$1 is missing"
  fi
}

for cmd in git node npm rustc cargo codex lsof ps pgrep; do
  require_cmd "$cmd"
done

if command -v node >/dev/null 2>&1; then
  node_version="$(node -v | sed 's/^v//')"
  node_major="${node_version%%.*}"
  info "Node.js version: $node_version"
  if [ "$node_major" -ge 20 ] 2>/dev/null; then
    pass "Node.js 20+"
  else
    fail "Node.js 20+ required for Canopy source build; found $node_version"
  fi
fi

if command -v rustc >/dev/null 2>&1; then
  info "$(rustc --version)"
fi
if command -v cargo >/dev/null 2>&1; then
  info "$(cargo --version)"
fi
if command -v git >/dev/null 2>&1; then
  info "$(git --version)"
fi
if command -v npm >/dev/null 2>&1; then
  info "npm $(npm --version)"
fi
if command -v codex >/dev/null 2>&1; then
  codex_version="$(codex --version 2>/dev/null || true)"
  [ -n "$codex_version" ] && info "$codex_version"
fi

printf '\n'
if [ "$failures" -eq 0 ]; then
  printf 'Environment gate: PASS\n'
  exit 0
fi

printf 'Environment gate: FAIL (%d issue(s))\n' "$failures"
exit 1
