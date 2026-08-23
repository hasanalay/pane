# Pane Foundation Bake-off

This directory contains decision artifacts for comparing two initial implementation strategies:

1. build Pane's native/core substrate independently;
2. start from Canopy's MIT-licensed source.

The source-level result favors a third, hybrid strategy: **use Canopy as a detached seed rather than as a permanently upstream-tracking fork**.

The full decision report is:

- [`../../docs/spikes/2026-08-23-foundation-bakeoff.md`](../../docs/spikes/2026-08-23-foundation-bakeoff.md)

The initial keep/rework/prune map is:

- [`CANOPY_SEED_KEEP_PRUNE.md`](CANOPY_SEED_KEEP_PRUNE.md)

## Golden path used by the bake-off

```text
repo
 ↓
PTY terminal
 ↓
Codex CLI
 ↓
npm run dev
 ↓
port detection
 ↓
embedded preview
 ↓
Git status / diff
```

Canopy already contains implementations for nearly every infrastructure step in that path. An independent Pane core would need to rebuild them before work on Pane's main differentiation — unified workspace/runtime orchestration — could begin.

## Important limitation

No source in this folder is claimed to have been compiled or benchmarked in the current execution environment. The final foundation choice has an explicit on-macOS build and golden-path gate before any Canopy source is imported into Pane.
