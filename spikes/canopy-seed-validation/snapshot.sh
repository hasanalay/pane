#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  printf 'Usage: %s <label> [canopy-pid]\n' "$0" >&2
  exit 2
fi

label="$1"
root_pid="${2:-${CANOPY_PID:-}}"
VALIDATION_HOME="${PANE_VALIDATION_HOME:-$HOME/.pane-validation}"
RUN_ID="${PANE_VALIDATION_RUN_ID:-$(date '+%Y%m%d-%H%M%S')}"
OUT_DIR="$VALIDATION_HOME/results/$RUN_ID"
mkdir -p "$OUT_DIR"

if [ -z "$root_pid" ]; then
  root_pid="$(pgrep -f 'Canopy — DEV|target/debug/canopy|/Canopy.app/Contents/MacOS/Canopy' 2>/dev/null | head -n 1 || true)"
fi

if [ -z "$root_pid" ]; then
  printf 'ERROR: could not discover Canopy PID. Pass it explicitly or export CANOPY_PID.\n' >&2
  exit 1
fi

if ! ps -p "$root_pid" >/dev/null 2>&1; then
  printf 'ERROR: PID %s is not running.\n' "$root_pid" >&2
  exit 1
fi

contains_pid() {
  needle="$1"
  haystack="$2"
  case " $haystack " in
    *" $needle "*) return 0 ;;
    *) return 1 ;;
  esac
}

pids="$root_pid"
frontier="$root_pid"

while [ -n "$frontier" ]; do
  next=""
  for parent in $frontier; do
    children="$(pgrep -P "$parent" 2>/dev/null || true)"
    for child in $children; do
      if ! contains_pid "$child" "$pids"; then
        pids="$pids $child"
        next="$next $child"
      fi
    done
  done
  frontier="$(printf '%s' "$next" | xargs 2>/dev/null || true)"
done

out="$OUT_DIR/${label}.txt"

{
  printf 'pane_canopy_validation_snapshot\n'
  printf 'label=%s\n' "$label"
  printf 'timestamp=%s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')"
  printf 'root_pid=%s\n' "$root_pid"
  printf 'pids=%s\n' "$pids"
  printf 'macos=%s\n' "$(sw_vers -productVersion 2>/dev/null || echo unknown)"
  printf 'arch=%s\n' "$(uname -m)"
  printf 'model=%s\n' "$(sysctl -n hw.model 2>/dev/null || echo unknown)"
  mem_bytes="$(sysctl -n hw.memsize 2>/dev/null || echo 0)"
  mem_gb="$(awk -v b="$mem_bytes" 'BEGIN { if (b > 0) printf "%.1f", b/1024/1024/1024; else print "unknown" }')"
  printf 'physical_memory_gb=%s\n' "$mem_gb"
  printf '\n[processes]\n'
  printf 'PID PPID RSS_KB CPU%% ELAPSED COMMAND\n'

  total_rss=0
  cpu_values=""
  for pid in $pids; do
    if ps -p "$pid" >/dev/null 2>&1; then
      ps -p "$pid" -o pid=,ppid=,rss=,%cpu=,etime=,command=
      rss="$(ps -p "$pid" -o rss= | tr -d ' ')"
      cpu="$(ps -p "$pid" -o %cpu= | tr -d ' ')"
      [ -n "$rss" ] && total_rss=$((total_rss + rss))
      [ -n "$cpu" ] && cpu_values="$cpu_values $cpu"
    fi
  done

  total_rss_mb="$(awk -v kb="$total_rss" 'BEGIN { printf "%.1f", kb/1024 }')"
  total_cpu="$(printf '%s\n' $cpu_values 2>/dev/null | awk '{s += $1} END {printf "%.1f", s+0}')"
  printf '\n[summary]\n'
  printf 'process_count=%s\n' "$(printf '%s\n' $pids | wc -l | tr -d ' ')"
  printf 'total_rss_mb=%s\n' "$total_rss_mb"
  printf 'summed_cpu_percent=%s\n' "$total_cpu"

  printf '\n[listening_tcp]\n'
  found_ports=0
  for pid in $pids; do
    lines="$(lsof -nP -a -p "$pid" -iTCP -sTCP:LISTEN 2>/dev/null || true)"
    if [ -n "$lines" ]; then
      printf '%s\n' "$lines"
      found_ports=1
    fi
  done
  [ "$found_ports" -eq 0 ] && printf '(none discovered)\n'
} > "$out"

printf 'Snapshot written: %s\n' "$out"
printf 'Root PID: %s\n' "$root_pid"
grep -E '^(process_count|total_rss_mb|summed_cpu_percent)=' "$out" || true
