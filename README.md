# Pane

**Pane** is an open-source-first, local-first developer control plane for keeping the active development loop inside one persistent workspace.

The product direction is broader than an AI IDE. Pane is intended to let a developer work with code, AI agents, terminals, local services, browser previews, Git/GitHub state, and eventually container/runtime state without constantly switching applications.

## Product thesis

> One workspace should retain the state of the normal edit → run → observe → debug → agent → inspect → commit → push loop.

The core product object is the **workspace**, not the editor and not the AI chat.

A Pane workspace is expected to evolve around peer capabilities such as:

- Files / editor
- AI agent sessions
- Independent terminals
- Managed local processes / dev servers
- Detected ports and embedded browser previews
- Git changes and GitHub workflow
- Docker / Compose / container runtime state
- Persisted pane layout and workspace state

## Current stage

Pane is currently in **product discovery and architecture validation**.

The repository initially contains product-definition and research artifacts. Implementation should begin after the first architecture spikes validate the workspace model and the open-source foundation.

## Documentation

- [`docs/product/PRODUCT_DEFINITION_v0.1.md`](docs/product/PRODUCT_DEFINITION_v0.1.md) — initial product definition, golden path, scope and non-goals
- [`docs/research/README.md`](docs/research/README.md) — research index and current conclusions
- [`docs/research/2026-08-23-veflow-developer-control-plane-research.md`](docs/research/2026-08-23-veflow-developer-control-plane-research.md) — deep-research artifact covering Veflow, Canopy, Tempest, Superset and the runtime/control-plane opportunity

## Current direction

The leading product/technical hypothesis is:

**Canopy/Tempest-style local workspace UX + Veflow-style agent/worktree orchestration + first-class runtime visibility.**

This is a hypothesis to validate, not a final architecture decision.
