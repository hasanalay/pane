# Pane Research Index

This directory contains discovery and competitive research used to shape Pane before implementation decisions are locked.

## Current research artifact

### Veflow as a Near-Match for an Open-Source Developer Control Plane / Developer Cockpit

File: [`2026-08-23-veflow-developer-control-plane-research.md`](2026-08-23-veflow-developer-control-plane-research.md)

The report sharpens Pane's category from “AI IDE” to **local-first Developer Control Plane** and analyzes the single-workspace requirement in which agent sessions, terminals, local processes, browser previews, Git state and runtime state remain concurrently available.

### High-confidence conclusions

- **Veflow** is a strong commercial reference for local repos, CLI agents, PTYs, worktrees, environment bootstrap, embedded editor and GitHub/PR workflow, but it is proprietary and is not a practical open-source fork foundation.
- **Canopy** is currently the strongest open-source architectural reference identified for Pane's local-control layer: MIT licensed, Tauri/Rust based, with PTYs, processes, file watchers, Monaco, local services, URLs/previews and Git/PR features.
- **Tempest** is an important UX reference for the exact “terminal URL → embedded browser beside the shell” workflow Pane wants to make normal.
- **Superset** is a useful reference for multi-agent/worktree orchestration and control surfaces, but its source-available licensing makes it less attractive as the core of a genuinely open-source project.
- The clearest remaining product gap is **first-class local runtime state** integrated with the same workspace: processes, ports, browser previews, Docker/Compose services, logs, health and lifecycle.

## Working product boundary

The current direction can be summarized as:

> Canopy/Tempest-style local workspace UX + Veflow-style agent/worktree orchestration + Docker/OrbStack-style runtime visibility.

Pane should not simply place many tools in one window. The differentiation must come from **shared workspace state and orchestration** between those tools.

## Next research/prototype questions

The research recommends moving away from broad competitor scanning and into bounded architecture experiments:

1. Canopy source architecture spike.
2. Single-window golden-path prototype.
3. Monaco vs. code-server/OpenVSCode editor bake-off.
4. Unified Docker/OrbStack/Podman runtime-provider prototype.
5. Compose-as-workspace experiment.
6. Git/GitHub credential and UX spike.
7. Context-switching usability benchmark.

See `../product/PRODUCT_DEFINITION_v0.1.md` for the product baseline derived from these findings.
