# Integration Notes Against Canopy

Pinned reference: `FluidWorksApp/canopy-ide@25c14a3dba5f656b58817993bc6587f499bebd9b`.

This file records the exact upstream seams the spike is intended to use.

## Native owner

Add:

```text
src-tauri/src/runtime.rs
```

The module should own Docker/runtime execution, validation and resource translation. The WebView should never receive a general-purpose shell primitive for routine runtime operations.

Canopy's documented native-capability flow explicitly expects privileged work to live in a Rust owner module and be exposed through bounded Tauri commands.

## Composition root

In `src-tauri/src/lib.rs`:

```rust
mod runtime;
```

Add these commands to Canopy's existing `tauri::generate_handler!` registry:

```rust
runtime::runtime_list_containers,
runtime::runtime_stop_container,
runtime::runtime_restart_container,
runtime::runtime_container_logs,
```

This spike does not require managed state because all four operations are bounded request/response calls. A production event-driven provider would likely introduce a `RuntimeManager` managed state for provider detection, event subscriptions, caches and teardown.

## Blocking boundary

The spike routes Docker CLI calls through Canopy's existing `blocking::io(...)` helper.

That matters because synchronous `Command::output()` must not park a Tauri/Tokio worker while Docker is slow or unavailable.

## Frontend IPC

Canopy's canonical frontend boundary is `src/ipc.ts`.

The functions in `runtime-ipc.ts` should be copied into that file for a real experiment rather than importing Tauri directly from feature components.

The prototype keeps them separate only so this repo can show the vertical slice without carrying Canopy's full `ipc.ts`.

## UI surface

There are two reasonable prototype placements.

### Option A — put containers under Servers

Fastest experiment.

Canopy already has `src/servers.ts` and `src/components/ServersPanel.tsx`, which model configured runs plus active process/port state. A small `Containers` section beneath the server groups would let us test runtime usefulness with minimal ProjectView changes.

**Pros**

- least code
- directly compares process runs and containers
- avoids a new project-surface lifecycle during the first experiment

**Cons**

- blurs local PTY-backed runs with runtime resources
- encourages Docker-specific concerns to leak into the server domain

### Option B — add Runtime as a project side panel

Better product boundary.

Canopy's project-surface playbook says a new panel requires updating the project tab/side-panel discriminated union, opener/render dispatch, close behavior and relevant persistence/restore paths.

For Pane this is the preferred direction because Runtime will eventually contain:

```text
local processes
Compose projects/services
containers
ports
health
logs
provider identity
```

For the smallest Canopy spike, Option A is sufficient. For Pane architecture, Option B is healthier.

## Events versus polling

`RuntimePanel.tsx` refreshes only on mount and after actions. That is intentional for the source spike.

A production provider should subscribe to runtime events and publish a single native invalidation/lifecycle stream to the frontend. Canopy's contributor guide explicitly prefers backend events or channels over browser polling for long-lived native state.

Expected production path:

```text
Docker/Podman event stream
        ↓
RuntimeManager
        ↓
Tauri runtime:change event
        ↓
frontend runtime store
        ↓
Runtime panel projection
```

Container logs and stats are continuous/high-volume data and should use a `Channel` or dedicated bounded stream rather than repeated `invoke` calls.

## Docker CLI versus Engine API

The CLI is appropriate for this spike because it proves the boundary with minimal dependency changes.

Do not build the final Pane runtime architecture around parsing CLI output.

The next implementation should introduce a provider contract first, then decide transport per provider:

```text
DockerEngineProvider  -> Docker Engine API
OrbStack              -> Docker-compatible engine first
PodmanProvider        -> compatible endpoint / Libpod capability layer
DevPodProvider        -> CLI/API adapter at the environment level
```

## Security notes

The spike uses direct process arguments, not a shell command string.

Before a production runtime feature ships:

- container/resource IDs must remain validated;
- destructive actions need distinct permissions;
- delete-volume/delete-image must never share the same approval class as restart;
- runtime operations must not be exposed to Canopy Remote or agents by default;
- any agent-facing tools should be separately registered through the agent/context capability boundary;
- output size, logs, stats and event queues must be bounded;
- provider processes/subscriptions must have explicit app/project shutdown behavior.

## What this spike proved

The smallest Docker feature does not require changes to Canopy's PTY manager, Git subsystem, browser implementation, agent lifecycle, filesystem watcher or editor model.

That is the core architecture result: runtime can be added as a peer native owner rather than being forced through an unrelated subsystem.
