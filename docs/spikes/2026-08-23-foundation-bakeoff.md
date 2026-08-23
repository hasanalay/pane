# Historical Spike — Independent Core vs Canopy Foundation Bake-off

**Status:** Superseded  
**Date:** 2026-08-23  
**Original Canopy baseline:** `FluidWorksApp/canopy-ide@25c14a3dba5f656b58817993bc6587f499bebd9b`

## Original conclusion

This spike originally recommended a **detached Canopy seed**: import a reviewed Canopy snapshot, prune unrelated product surface and evolve Pane independently.

That recommendation is no longer active.

## Current decision

Pane is being built as an **independent codebase**. Canopy is retained only as an architecture/implementation reference.

See:

- [`../decisions/ADR-0001-independent-pane-core.md`](../decisions/ADR-0001-independent-pane-core.md)
- [`../decisions/ADR-0002-m0-foundation.md`](../decisions/ADR-0002-m0-foundation.md)
- [`../product/M0_LOCAL_AGENT_WORKSPACE.md`](../product/M0_LOCAL_AGENT_WORKSPACE.md)

## Why the decision changed

Source review and a real macOS run proved that Canopy already contains a large, opinionated product model in addition to useful infrastructure.

The detached-seed path would save implementation time for PTY/process/editor/preview primitives, but it would also make Pane begin as a transformation of Canopy rather than as its own product.

Pane's first milestone is now narrow enough that owning the codebase from the start is more valuable:

```text
folder
→ Codex in real PTY
→ changed files / diff
→ npm/pnpm dev
→ automatic server discovery
→ integrated browser
```

## Findings that remain useful

The spike still established several valuable reference points:

- real PTY/process lifecycle is harder than a terminal-looking UI;
- interactive coding CLIs should remain real local processes;
- filesystem change handling must protect unsaved buffers;
- local dev-server discovery should be tied to process ownership rather than only port numbers;
- embedded preview must be isolated from privileged desktop APIs;
- Git and filesystem state need explicit invalidation/refresh semantics;
- Canopy is a useful implementation reference for these problems.

## Historical record

The original detailed bake-off remains available in Git history before this document was superseded.
