# Historical Spike — Canopy Architecture Review

**Status:** Historical reference  
**Date:** 2026-08-23  
**Reviewed baseline:** `FluidWorksApp/canopy-ide@25c14a3dba5f656b58817993bc6587f499bebd9b`

## Purpose

This spike examined Canopy to learn how a mature local-first agent workspace handles native PTYs, process lifecycle, filesystem access, Git, editor integration, run processes, port discovery and embedded previews.

It also tested whether a Docker/runtime capability could fit into Canopy's native-owner → Tauri IPC → frontend architecture.

## Current status

Canopy is **not** Pane's foundation.

Pane will not fork, seed from or embed Canopy. The active decision is documented in [`../decisions/ADR-0001-independent-pane-core.md`](../decisions/ADR-0001-independent-pane-core.md).

## Reference findings that remain useful

- Tauri + Rust is a credible boundary for privileged local capabilities.
- PTYs and child-process ownership should live outside React presentation state.
- Interactive coding agents work well when their real CLIs are preserved rather than replaced by a custom chat abstraction.
- Process/server state should be modeled explicitly rather than inferred from terminal text alone.
- Listening ports are useful workspace state and can drive one-click preview.
- Editor/file watchers need clear handling for external modifications.
- Browser/preview content must be isolated from filesystem/shell authority.
- Typed IPC boundaries are preferable to arbitrary shell execution from UI code.

## Important Pane difference discovered during validation

Canopy's Servers surface is primarily organized around configured/managed run commands. A normal shell command such as `npm run dev` does not automatically become a managed server merely because it is running in a generic terminal.

Pane M0 intentionally chooses a different baseline:

> A process started inside a Pane-owned PTY is observable workspace state. If that owned process tree opens a localhost listener, Pane should surface it under Servers without requiring prior run-command configuration.

See [`../product/M0_LOCAL_AGENT_WORKSPACE.md`](../product/M0_LOCAL_AGENT_WORKSPACE.md).

## Historical record

The original detailed source analysis and Docker-integration sketch remain available in Git history. Root-level Canopy-specific prototype code has been removed from the active Pane repository surface because it is no longer on the implementation path.
