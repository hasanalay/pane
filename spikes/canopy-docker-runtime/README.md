# Canopy Docker Runtime Spike

This directory is a **source-level integration spike**, not Pane production code.

It answers one question:

> Does a first-class Docker/runtime capability fit cleanly into Canopy's existing architecture, or would it require fighting the codebase?

**Result:** it fits cleanly.

The prototype is shaped for Canopy's native-capability pattern at upstream commit:

`FluidWorksApp/canopy-ide@25c14a3dba5f656b58817993bc6587f499bebd9b`

## Vertical slice

```text
Docker CLI
   ↓
runtime.rs
   ↓
Tauri command registry
   ↓
runtime-ipc.ts / src/ipc.ts
   ↓
RuntimePanel.tsx
```

The source sketch implements:

- list all local containers
- stop a container
- restart a container
- read a bounded tail of container logs

The implementation deliberately uses direct `Command` arguments instead of shell strings.

## Why use the Docker CLI in the spike?

Canopy already shells out to the user's installed `git` and `gh` tools for several workflows. A Docker CLI adapter lets us test the architecture boundary without first introducing a new Engine API client and event model.

This should not be mistaken for Pane's final runtime architecture.

A later Pane runtime subsystem should normalize providers behind a contract roughly like:

```text
RuntimeProvider
├── detect()
├── projects()
├── containers()
├── events()
├── start(id)
├── stop(id)
├── restart(id)
├── logs(id)
└── stats(id)
```

Docker Desktop and OrbStack can initially converge through Docker compatibility. Podman/DevPod can add provider-specific capabilities later.

## How this would enter Canopy

1. Move/adapt `runtime.rs` to `src-tauri/src/runtime.rs`.
2. Add `mod runtime;` in the native composition root.
3. Register the four `runtime_*` Tauri commands in `tauri::generate_handler!`.
4. Move the wrappers from `runtime-ipc.ts` into Canopy's canonical `src/ipc.ts`.
5. Mount `RuntimePanel.tsx` either:
   - as a new project surface, or
   - under the existing Servers execution surface for the smallest experiment.
6. Add Rust parser/validation tests and React behavior tests.
7. Keep the capability unavailable to Canopy Remote during the spike.

## Why not directly extend ServersPanel?

For a disposable experiment, putting a small container section beneath Servers is acceptable.

For Pane's product model, runtime deserves a separate domain owner because a container is not merely a terminal-backed run. Containers have independent lifecycle, health, images, networks, volumes, Compose relationships and provider identity.

The UI may later merge local runs and containers into one **Runtime** pane, but the underlying authorities should remain separate.

## Verification status

This prototype was checked against Canopy's documented source boundaries and the actual source files in GitHub.

It has **not** been compile-run against Canopy in this environment because the available execution environment does not provide Docker or Rust tooling and cannot directly clone GitHub. Treat the code as a concrete patch sketch, not a verified upstream PR.

The important result of the spike is architectural: Canopy already has the exact native-owner → Tauri IPC → frontend projection seam that a runtime provider needs.
