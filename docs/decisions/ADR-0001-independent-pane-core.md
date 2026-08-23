# ADR-0001 — Pane Owns Its Product and Codebase

**Status:** Accepted  
**Date:** 2026-08-23

## Context

Early Pane research identified Canopy as a strong open-source near-match for several difficult primitives: PTYs, agent CLIs, editor/diff surfaces, run processes, port discovery, embedded preview and Git/worktree behavior.

A foundation bake-off initially favored using a pinned Canopy revision as a detached source seed, then pruning and reshaping it into Pane.

A real macOS validation run confirmed that Canopy is a substantial, working product rather than merely a library substrate. Its product model, layout, navigation, feature surface and architecture are already opinionated and broad.

Pane's intended identity is narrower at first and should be independently owned. Reworking a mature Canopy product into Pane would make Canopy's existing assumptions the default center of the new product.

## Decision

Pane will be developed as an **independent codebase from the beginning**.

Canopy is a reference implementation, not a foundation.

Pane will not:

- fork Canopy as its main repository;
- import a complete Canopy source snapshot as a seed;
- embed Canopy inside Pane;
- rebrand Canopy UI as Pane;
- preserve Canopy's information architecture merely to save implementation time.

Pane may:

- study Canopy source and architecture;
- reuse general implementation patterns;
- compare behavior against Canopy during debugging/design;
- selectively port clearly bounded MIT-licensed code later when the value is high and licensing/attribution requirements are handled explicitly.

Any copied/ported code must be treated as an explicit dependency/provenance decision, not as an invisible foundation.

## Why

### Product ownership

Pane should be recognizable as its own product in architecture and UX, not as a modified Canopy distribution.

### Scope control

Canopy includes many areas outside Pane M0: collaboration, remote access, notes/research, credential tooling, team features, richer agent management and other surfaces. Starting with them would turn deletion/refactoring into the first major engineering effort.

### Architecture control

Pane's first domain model is intentionally small:

```text
Workspace
├── Files
├── Changes
├── Terminals
├── Processes
├── Servers
└── Browser
```

This model should emerge directly from Pane's product requirements.

### UX control

M0 optimizes for one loop:

```text
folder → Codex → change → diff → run → preview
```

A clean codebase allows the UI to be designed for this loop rather than adapted around an existing product's navigation and state model.

## Consequences

### Positive

- Pane owns naming, architecture, UX and product identity.
- M0 can remain much smaller than Canopy.
- No ongoing upstream merge burden.
- Features are added because Pane needs them, not because they exist in the seed.
- Canopy remains useful as a high-quality reference for difficult implementation details.

### Negative

- Pane must implement its own PTY/process/filesystem/browser substrate.
- Initial delivery will be slower than rebranding an existing app.
- We must avoid re-solving known edge cases poorly; reference research and focused spikes remain important.

## Superseded decisions

The recommendation in `docs/spikes/2026-08-23-foundation-bakeoff.md` to use a detached Canopy seed is superseded by this ADR.

That document remains historical context only.

## Follow-up

Implementation follows `docs/product/M0_LOCAL_AGENT_WORKSPACE.md` and `ADR-0002-m0-foundation.md`.
