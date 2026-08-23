# Pane Research Index

This directory preserves competitive and architecture research that informed Pane before M0 implementation.

Research is now **reference context**, not the active product spec. Current implementation decisions live under `docs/product/` and `docs/decisions/`.

## Main research artifact

### Veflow as a Near-Match for an Open-Source Developer Control Plane / Developer Cockpit

File: [`2026-08-23-veflow-developer-control-plane-research.md`](2026-08-23-veflow-developer-control-plane-research.md)

The report established several useful long-term observations:

- Veflow is a strong commercial reference for local repos, CLI agents, PTYs, worktrees, editor and GitHub/PR integration.
- Canopy is a strong open-source reference for Tauri/Rust local capabilities, PTYs, process lifecycle, file watching, Monaco, local services, previews and Git workflows.
- Tempest is a useful UX reference for terminal + embedded browser workflows.
- Superset is a useful orchestration reference, but its source-available licensing makes it unattractive as the basis of an open-source Pane core.
- Shared workspace state is more important than merely placing tools in one window.

## Decision after research

The research originally led to a short-lived hypothesis that Pane could use Canopy as a detached source seed.

That direction is now **superseded**.

Pane will be built from an independent codebase. Canopy and the other products above remain references only. See:

- [`../decisions/ADR-0001-independent-pane-core.md`](../decisions/ADR-0001-independent-pane-core.md)
- [`../product/PRODUCT_DEFINITION_v0.2.md`](../product/PRODUCT_DEFINITION_v0.2.md)
- [`../product/M0_LOCAL_AGENT_WORKSPACE.md`](../product/M0_LOCAL_AGENT_WORKSPACE.md)

## Current implementation focus

Broad competitor scanning is no longer the next step.

M0 is intentionally narrow:

```text
Open Folder
→ lightweight editor
→ real PTY / Codex
→ Changes / Diff
→ npm/pnpm dev process
→ automatic server/port discovery
→ integrated browser
```

Future research should be pulled only when a concrete M0 implementation decision needs evidence.
