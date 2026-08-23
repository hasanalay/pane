#!/usr/bin/env bash
set -euo pipefail

VALIDATION_HOME="${PANE_VALIDATION_HOME:-$HOME/.pane-validation}"
FIXTURE_INPUT="${1:-${PANE_FIXTURE_ROOT:-$VALIDATION_HOME/fixture}}"

if [ ! -d "$FIXTURE_INPUT" ]; then
  printf 'ERROR: fixture root does not exist: %s\n' "$FIXTURE_INPUT" >&2
  exit 2
fi

FIXTURE="$(cd "$FIXTURE_INPUT" && pwd -P)"
patterns='codex|node|npm|npx|vite|canopy|cargo|rustc'
candidates="$(pgrep -f "$patterns" 2>/dev/null || true)"
leftovers=0

printf 'Checking likely development processes with CWD under:\n  %s\n\n' "$FIXTURE"

for pid in $candidates; do
  [ "$pid" = "$$" ] && continue
  if ! ps -p "$pid" >/dev/null 2>&1; then
    continue
  fi

  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1 || true)"
  [ -z "$cwd" ] && continue

  case "$cwd" in
    "$FIXTURE"|"$FIXTURE"/*)
      command_line="$(ps -p "$pid" -o command= 2>/dev/null || true)"
      printf 'LEFTOVER pid=%s cwd=%s\n' "$pid" "$cwd"
      printf '         %s\n' "$command_line"
      leftovers=$((leftovers + 1))
      ;;
  esac
done

printf '\n'
if [ "$leftovers" -eq 0 ]; then
  printf 'Cleanup gate: PASS — no likely fixture-owned development process found.\n'
  exit 0
fi

printf 'Cleanup gate: FAIL — %d likely fixture-owned process(es) still running.\n' "$leftovers"
printf 'Inspect ownership before killing anything; this script never terminates processes.\n'
exit 1
