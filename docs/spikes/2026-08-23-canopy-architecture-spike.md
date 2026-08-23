# Canopy Architecture Spike — Pane

**Date:** 2026-08-23  
**Pane stage:** architecture validation  
**Canopy source examined:** `FluidWorksApp/canopy-ide` at `main` commit `25c14a3dba5f656b58817993bc6587f499bebd9b`

## Decision

**Canopy is technically forkable and is an excellent implementation reference, but Pane should not commit to Canopy as its permanent product foundation yet.**

The architecture is unusually compatible with Pane's needs. A Docker/runtime capability fits cleanly into Canopy's existing native-capability boundary with a small, understandable set of changes. That validates an important part of the original hypothesis.

The larger issue is product inheritance. Canopy already contains a broad product surface that Pane does not currently need: Remote, encrypted team collaboration, notes/research, credential vault, dictation, Android tooling, companion infrastructure, tunnel providers, extensive agent-specific behavior, and other Canopy-specific features. Forking the entire product would make Pane responsible for that complexity and for continuously reconciling an upstream product whose priorities are different.

**Working recommendation:**

1. Treat Canopy as the strongest open-source architecture/reference implementation.
2. Use targeted source-level spikes to validate Pane subsystems against Canopy's seams.
3. Borrow patterns, domain boundaries, and selected MIT-licensed implementation ideas where appropriate and legally compatible.
4. Do not create a permanent Pane fork until the golden-path prototype proves that carrying Canopy saves more work than it creates.

The practical classification is therefore:

> **Fork-worthy for a short-lived prototype; reference-first for Pane's long-term architecture.**

---

## 1. What was inspected

Primary Canopy sources used for this spike:

- `LICENSE.md`
- `README.md`
- `package.json`
- `src-tauri/Cargo.toml`
- `docs/architecture.md`
- `docs/core-rust-system.md`
- `docs/contributor-integrations.md`
- `docs/contributions/native-capability.md`
- `docs/contributions/project-surface.md`
- `src/servers.ts`
- `src/components/ServersPanel.tsx`
- `src-tauri/src/blocking.rs`

Upstream repository: https://github.com/FluidWorksApp/canopy-ide

### License

Canopy's checked-in `LICENSE.md`, root `package.json`, and Rust `Cargo.toml` all identify the project as **MIT licensed**. GitHub's repository metadata currently reports the license classifier as `NOASSERTION`, but the actual checked-in license text is the standard MIT license. For any future reuse, retain copyright/license notices and review `THIRD-PARTY-NOTICES.md` for dependency-specific obligations.

---

## 2. Canopy's architecture is close to the architecture Pane wants

Canopy is a Tauri v2 desktop application with a React WebView. Its architecture explicitly assigns privileged and long-lived native resources to Rust while React owns workspace composition and presentation.

The split is approximately:

```text
React / WebView
├── project/workspace composition
├── panels / tabs / navigation
├── Monaco presentation
└── typed frontend projections
        │
        │ Tauri IPC / Channel / events
        ▼
Rust native core
├── PTYs and child processes
├── filesystem and watchers
├── Git / gh / worktrees
├── LSP processes
├── agent process telemetry
├── preview proxies
├── native browser views
├── local servers
└── resource teardown
```

This matches a core Pane principle: the WebView should not receive arbitrary filesystem, process, Docker, credential, or shell authority. The native layer should own those capabilities and expose typed, narrow operations.

### Why this matters for Pane

Adding runtime/container support does **not** require putting Docker logic inside Monaco, an extension host, or React components. It naturally belongs beside Canopy's existing PTY, Git, preview, process, and filesystem owners.

That is the strongest positive result from this spike.

---

## 3. Existing execution model is already useful for Pane

Canopy's `src/servers.ts` is especially relevant.

It joins two sources:

1. configured project/component run commands;
2. run tabs/processes that actually exist.

The resulting `ServerEntry` model already contains:

- command/name
- running/stopped/done/failed state
- PTY identity
- exit code
- detected TCP ports
- component/workspace identity
- ad-hoc process state

This means Canopy already answers a large part of Pane's question:

> "What is currently running in this project, where is it running, and what can I open?"

The associated `ServersPanel` exposes start, stop, restart, terminal focus, detected ports, and opening a localhost preview.

For Pane, the missing layer is not a second process manager. It is a **runtime topology layer** that can join container/Compose state with this existing process/service view.

A future Pane model can conceptually extend:

```text
Run / Server
├── process
├── PTY
├── ports
└── preview
```

into:

```text
Runtime
├── local process / run
├── Compose service
├── container
├── ports
├── health
├── logs
└── preview
```

---

## 4. Browser/preview architecture is already stronger than expected

Canopy is not merely opening localhost URLs in the user's external browser.

Its Rust core owns native child WebViews and origin-specific loopback preview proxies. The architecture documentation describes preview instrumentation, network logging, redirect handling, screenshots, and agent/browser tooling. React supplies layout intent while Rust owns the actual native browser resource.

This is highly aligned with Pane's single-workspace goal:

```text
Codex / agent
+ terminal
+ dev server
+ localhost preview
+ code/diff
```

can remain mounted in one application without Chrome/Safari becoming part of the normal loop.

This substantially reduces the amount of original browser infrastructure Pane would need if a Canopy-derived prototype were used.

---

## 5. The Docker/runtime integration seam is clean

Canopy's native-capability playbook defines a standard four-part path:

```text
src-tauri/src/<owner>.rs
        │
        ▼
src-tauri/src/lib.rs        command registration / managed state
        │
        ▼
src/ipc.ts                  typed frontend wrapper
        │
        ▼
React feature / panel
```

For a minimal Docker spike, the required conceptual change is therefore:

```text
runtime.rs
├── detect Docker CLI / provider
├── list containers
├── start / stop / restart
└── bounded logs request

lib.rs
└── register runtime_* commands

ipc.ts
└── typed runtime wrappers

RuntimePanel.tsx
└── render container state and actions
```

No architectural rewrite is required.

### Minimal spike change count

A proof-of-concept can be implemented with roughly:

- **1 new Rust owner module**
- **1 command-registration edit**
- **1 typed IPC edit**
- **1 React panel**
- **1 ProjectView/surface registration edit** if exposed as its own project surface
- focused Rust/frontend tests

That is a clean feature seam.

### Why the spike uses Docker CLI first

The prototype under `spikes/canopy-docker-runtime/` deliberately uses the installed `docker` CLI rather than immediately adding a Docker Engine client crate.

This mirrors Canopy's existing philosophy for Git and `gh`: reusing the user's installed tool preserves the user's environment and makes the first architecture test smaller.

This is **not** the proposed final runtime architecture.

A production Pane runtime layer should evolve toward:

```text
RuntimeProvider
├── DockerEngineProvider
├── PodmanProvider
├── DevPodProvider
└── provider-specific capabilities
```

with Docker Desktop and OrbStack initially converging through Docker compatibility.

The CLI spike answers only one question:

> Can a privileged runtime capability enter the Canopy architecture without fighting it?

The answer is **yes**.

---

## 6. Security fit is also good

Canopy's existing architecture already enforces several policies Pane needs:

- privileged resources live in Rust;
- typed Tauri commands are explicit;
- path access is scoped through a workspace manager;
- blocking system operations go through a known blocking boundary;
- Remote is fail-closed and does not inherit desktop authority;
- process lifecycle and cleanup are treated as correctness concerns.

A Docker integration can follow the same model.

For normal runtime operations, Pane should expose typed operations such as:

```text
runtime.list_containers()
runtime.restart_container(id)
runtime.stop_container(id)
runtime.logs(id, tail)
```

rather than giving the WebView:

```text
run_shell("docker ...")
```

The prototype intentionally calls `Command` with direct arguments instead of shell interpolation, and validates resource identifiers before destructive operations.

A later production design should further distinguish permission classes:

- inspect runtime
- read logs
- start/restart service
- stop service
- create/delete container
- delete image
- delete volume

Deleting a database volume must never be equivalent to restarting a dev service.

---

## 7. Where Canopy becomes expensive as a permanent fork

The same codebase that makes the spike easy also creates long-term product inheritance.

Canopy's Rust core owns much more than Pane currently needs, including:

- Canopy Remote
- encrypted peer collaboration / relay
- notes and research stores
- provenance and search indexes
- encrypted browser credential vault
- dictation and audio state
- Android device/emulator tooling
- clipboard history
- tunnel provider lifecycle
- app-wide companion process
- agent hook/MCP sidecar
- multiple collaboration and browser-control boundaries

None of these are inherently bad. The concern is ownership.

If Pane forks Canopy, these become Pane maintenance responsibilities even when they are not part of Pane's thesis.

### ProjectView coupling

Canopy's own architecture guide states that `ProjectView` is intentionally stateful and currently large. It is the project composition root for tabs, terminals, editor surfaces, panels, agents, runs, previews, and feature dispatch.

This is manageable for adding one feature, but it is a warning for a permanent fork: Pane's workspace/pane model may eventually need different composition rules. Reworking that central component while also tracking upstream changes would create ongoing merge pressure.

### No general plugin host

Canopy is extensible through explicit typed seams, but its contributor guide explicitly says it is **not a general plugin host**.

Pane's long-term plan expects agents, editors, runtime providers, and integrations to become replaceable adapters/providers. That is a different extensibility ambition.

A Canopy fork could add such a model, but doing so would be a product-level architectural change rather than a small extension.

---

## 8. Fork vs independent foundation scorecard

| Area | Canopy as base | Assessment |
|---|---:|---|
| Tauri/Rust desktop boundary | 9/10 | Excellent fit |
| PTY / terminal infrastructure | 9/10 | Major amount of hard work already solved |
| Local process ownership | 9/10 | Strong lifecycle/resource model |
| Local preview/browser | 9/10 | Very close to Pane's target |
| Git/worktree integration | 9/10 | Strong and already local-first |
| Monaco/LSP | 8/10 | Suitable for Pane's early editor boundary |
| Agent CLI execution | 9/10 | Strong fit |
| Runtime/Docker extensibility | 8/10 | Clean native seam; missing provider model |
| Pane-style provider/plugin architecture | 5/10 | Would need to be introduced |
| Product-scope alignment | 5/10 | Canopy carries many unrelated features |
| Long-term upstream merge cost | 4/10 | High if Pane meaningfully diverges |
| Speed to a convincing prototype | 9/10 | Very high |

### Result

**Prototype foundation:** strong yes.  
**Permanent fork decision:** not yet.  
**Architecture/reference value:** extremely high.

---

## 9. Concrete Docker/runtime source spike

The repository contains a deliberately small source prototype:

```text
spikes/canopy-docker-runtime/
├── README.md
├── runtime.rs
├── runtime-ipc.ts
└── RuntimePanel.tsx
```

It demonstrates the exact vertical path:

```text
Docker CLI
   ↓
Rust runtime owner
   ↓
Tauri command
   ↓
typed frontend IPC
   ↓
Runtime panel
```

The prototype supports the shape of:

- list containers
- restart container
- stop container
- bounded tail logs

It intentionally does not implement:

- Docker Engine event streaming
- container stats streaming
- Compose topology
- image/volume/network management
- provider abstraction
- agent permissions
- Remote exposure

Those would be premature before the base decision.

---

## 10. Verification status and limitation

This spike is **source-verified but not live-runtime verified**.

The Canopy source and architecture were inspected directly from GitHub at the pinned upstream commit. The current execution environment available for this research does not contain Docker or Rust tooling and cannot clone GitHub directly, so the Docker prototype could not be compiled inside the actual Canopy repository or exercised against a live Docker daemon here.

Therefore the conclusion is specifically:

> The integration is architecturally clean according to Canopy's actual source boundaries and contributor contracts.

It is **not yet** a claim that the prototype patch compiles unchanged on the first attempt.

The next local engineering check on a macOS development machine should be:

```text
1. clone Canopy at 25c14a3d...
2. copy/adapt runtime.rs into src-tauri/src/runtime.rs
3. register four commands in lib.rs
4. add typed wrappers to src/ipc.ts
5. mount a temporary RuntimePanel
6. run cargo tests + npm typecheck
7. exercise against Docker Desktop or OrbStack
```

That check should be small enough to finish in hours rather than days.

---

## 11. Pane architecture decision after this spike

This spike changes the working direction slightly.

Before:

> Maybe fork Canopy and add the missing runtime layer.

After:

> Use Canopy to validate the hard native/workspace patterns, but design Pane's own control-plane domain model before inheriting Canopy's full product.

Pane should preserve these Canopy patterns:

- Rust owns privileged/native resources.
- React owns composition/presentation.
- PTYs are real local processes.
- Workspace roots are explicit security boundaries.
- Long-lived panes preserve state rather than constantly remounting.
- Native events invalidate projections instead of turning the WebView into a polling engine.
- Git/agent CLIs can reuse user-installed tools and credentials.
- Preview is a first-class local resource, not an external-browser escape hatch.
- Cleanup/teardown is part of feature correctness.

Pane should add its own top-level abstraction:

```text
WorkspaceController
├── FilesystemProvider
├── GitProvider
├── AgentProvider
├── ProcessProvider
├── PreviewProvider
├── RuntimeProvider
└── EditorProvider
```

The exact names are not final. The important decision is that Docker, Codex, Monaco, Git, or Canopy itself must not become the foundation of Pane's product model.

---

## 12. Recommended next spike

The next architecture experiment should no longer be broad Canopy analysis.

It should prove Pane's **own** smallest control core:

```text
Open repository
  ↓
Workspace controller
  ├── spawn one PTY
  ├── launch Codex as a child CLI
  ├── launch npm run dev
  ├── discover localhost port
  ├── open embedded preview
  └── read Git status
```

The goal is to compare the amount of implementation required for:

1. a very small independent Pane Tauri shell; versus
2. implementing the same golden path as a Canopy fork.

That comparison will produce the real fork/no-fork decision.

Until then, the Canopy question remains intentionally open, with a bias toward **reference-first, independent-core**.
