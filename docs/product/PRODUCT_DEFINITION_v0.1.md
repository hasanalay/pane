# Pane Product Definition v0.1 — Superseded

**Status:** Historical / superseded  
**Date:** 2026-08-23

This was Pane's first discovery-phase product definition. It captured the broader **Developer Control Plane / Developer Cockpit** direction before the first implementation milestone was narrowed.

It is no longer the active product spec.

## Superseded by

- [`PRODUCT_DEFINITION_v0.2.md`](PRODUCT_DEFINITION_v0.2.md) — current product direction
- [`M0_LOCAL_AGENT_WORKSPACE.md`](M0_LOCAL_AGENT_WORKSPACE.md) — current buildable milestone
- [`../decisions/ADR-0001-independent-pane-core.md`](../decisions/ADR-0001-independent-pane-core.md) — independent Pane codebase decision
- [`../decisions/ADR-0002-m0-foundation.md`](../decisions/ADR-0002-m0-foundation.md) — M0 technical foundation

## What remains useful from v0.1

The following long-term principles still inform Pane:

- reduce context switching during development;
- treat files, terminals, agents, processes and previews as shared workspace state rather than unrelated tools;
- prefer existing local developer tools over proprietary replacements;
- keep privileged local-machine operations behind a narrow native boundary;
- avoid becoming a worse clone of VS Code, Docker Desktop or other large tools merely by combining their feature lists.

## What changed

v0.1 considered a broad initial surface including worktrees, GitHub/PR workflows, runtime/container state and richer layout composition.

M0 deliberately removes those from the first implementation and focuses on:

```text
Open Folder
→ lightweight editor
→ real PTY / Codex
→ Changes / Diff
→ npm/pnpm dev
→ automatic server discovery
→ integrated browser
```

The original v0.1 content remains available in Git history for decision archaeology.
