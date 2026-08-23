# Pane Foundation Bake-off — Independent Core vs Canopy

**Date:** 2026-08-23  
**Stage:** architecture validation  
**Canopy baseline:** `FluidWorksApp/canopy-ide` at `25c14a3dba5f656b58817993bc6587f499bebd9b`

## Decision

The source-level bake-off does **not** support building Pane's native foundation from scratch as the next move.

It also does **not** support maintaining Pane as a conventional long-lived fork that continuously merges Canopy upstream.

The best current path is a third option:

> **Use Canopy as a detached seed foundation: pin/import a reviewed MIT-licensed Canopy revision, turn it into Pane, deliberately prune unrelated product surface, introduce Pane-owned provider boundaries, and selectively port/cherry-pick upstream fixes rather than treating upstream merges as the product architecture.**

This recommendation is still gated by one execution check on a real macOS development machine. The current environment could inspect GitHub source but could not clone/build/run Tauri, Rust, Node, Docker, or measure memory/startup behavior. Therefore this report is an architecture/source bake-off, not a runtime benchmark.

---

## 1. The golden path being compared

Both foundations are evaluated against exactly the same Pane workflow:

```text
Open local repository
        ↓
Open independent PTY terminal
        ↓
Run Codex CLI in another PTY
        ↓
Run `npm run dev`
        ↓
Discover the local listening port
        ↓
Open the app in an embedded preview
        ↓
Inspect Git status / diff
        ↓
Keep all of the above alive in one workspace
```

The question is not whether either architecture can eventually do this.

The question is:

> Which foundation gets Pane to this experience with the least technical risk while preserving enough architectural freedom for Pane's runtime/control-plane direction?

---

## 2. Option A — independent Pane core

An independent implementation would give Pane perfect control over its domain model from day one.

A minimal architecture could be intentionally small:

```text
Pane Desktop
├── React workspace shell
├── pane/split layout
├── Monaco
└── xterm.js
        │
        │ typed Tauri IPC
        ▼
Pane Core — Rust
├── WorkspaceManager
├── PtyManager
├── ProcessManager
├── PortDiscovery
├── GitAdapter
├── PreviewManager
└── AgentAdapter registry
```

This is architecturally attractive, but the golden path hides a large amount of systems work.

### What would have to be built before Pane even reaches parity with the golden path

#### Desktop / workspace

- Tauri application bootstrap and packaging
- project/workspace persistence
- tab and split-pane persistence
- hibernation/recovery rules
- filesystem root scoping
- native lifecycle cleanup

#### PTY / process infrastructure

- native PTY creation
- binary/raw output streaming into xterm.js
- resize handling
- input writes
- backpressure
- bounded scrollback
- exit propagation
- process-tree discovery
- process-group termination
- stale-process recovery
- application-exit cleanup

This is infrastructure where a prototype that merely works is substantially easier than an application developers can trust to keep open all day.

#### Agent execution

- CLI discovery
- launch environment
- CWD/worktree association
- terminal identity
- resume semantics where supported
- lifecycle/status projection

#### Run / port model

- configured run commands
- ad-hoc running processes
- process telemetry
- listening-port discovery
- port/worktree association
- collisions between parallel worktrees

#### Embedded browser / preview

A naive WebView pointing at `localhost:3000` is not equivalent to a robust developer preview.

A serious implementation eventually needs to handle:

- navigation
- HMR/WebSockets
- redirects
- local-origin behavior
- visibility and pane resizing
- process-to-preview association
- screenshots/inspection if agents are later allowed to observe the app
- safe separation between preview content and Pane's privileged IPC surface

#### Git

- status
- staged/unstaged changes
- diff
- stage/unstage
- commit
- push
- worktrees
- filesystem invalidation after Git operations
- existing credential helpers / SSH / hooks

### Independent-core advantage

The architecture would start exactly around Pane's domain:

```text
Workspace
├── AgentProvider
├── Terminal/Process
├── RuntimeProvider
├── PreviewProvider
├── GitProvider
└── EditorProvider
```

There would be no inherited Canopy product model to undo.

### Independent-core disadvantage

It spends the first major development period rebuilding native primitives that are not Pane's differentiation.

Pane's differentiator is the **shared workspace/control-plane model**, not having its own bespoke PTY implementation or reverse proxy.

---

## 3. Option B — conventional long-lived Canopy fork

Canopy already implements nearly the entire golden path.

### Repository / local workspace

Canopy is explicitly local-first. Rust owns filesystem access and workspace containment while React owns project composition.

### PTY / terminals

Canopy has a mature native PTY subsystem rather than shelling out from the WebView. Its architecture owns PTYs and child-process lifecycle in Rust and sends bounded terminal streams to xterm.js.

### Codex / agent CLI

Canopy already runs Codex and other coding CLIs as real PTY child processes. Agent terminals remain the actual agent interface rather than being emulated by a proprietary chat layer.

### `npm run dev` / managed runs

Canopy already has configured run commands and a project-wide Servers model.

Its `ServerEntry` joins configured commands with the run tabs/processes that actually exist and records:

- running/stopped/done/failed
- PTY identity
- exit code
- listening ports
- component/workspace identity
- ad-hoc processes

### Port discovery

Ports discovered for a run are already exposed in the server model and UI.

### Embedded preview

Canopy already owns native child WebViews and local preview proxies. This is materially more work than embedding a bare browser element.

### Git / diff / worktree

Canopy already has local Git, worktrees, changes/diffs, GitHub/PR functionality and filesystem invalidation around those operations.

### Layout

Canopy already has stateful project surfaces and split/tree layout primitives. Its architecture intentionally keeps long-lived surfaces mounted while hidden, which matches Pane's requirement that active development contexts remain recoverable without reconstructing them.

### Result

For the exact golden path, Canopy is not merely an architectural reference. It is already a large implementation of the hard native substrate Pane needs.

That means a conventional fork wins dramatically on **time to first convincing Pane workspace**.

But it creates another problem: Pane would inherit the entire Canopy product and its upstream evolution.

---

## 4. Why a permanent upstream-tracking fork is still the wrong default

Canopy is broader than Pane's current thesis.

Its native core and product include substantial systems that are not required for Pane's first direction, including:

- Canopy Remote / portal
- encrypted peer/team collaboration and relay
- notes/research/provenance stores
- full-text search over multiple knowledge sources
- credential vault
- dictation and audio handling
- Android device/emulator tooling
- clipboard history
- public tunnel providers
- app-wide Companion infrastructure
- agent hook/MCP sidecar behavior
- collaboration transports and Remote permission surfaces

These are legitimate Canopy features. They are simply not free for a fork.

Every retained subsystem adds:

- dependencies
- startup/lifecycle paths
- permissions/security surface
- tests
- packaging obligations
- future upstream conflicts
- concepts Pane developers must understand

### Project composition coupling

Canopy's architecture documentation explicitly describes `ProjectView` as intentionally stateful and currently large. It is the composition root for project tabs, terminals, editor surfaces, panels, agents, runs and previews.

Pane's long-term workspace IA may diverge heavily here because Pane intends code, agent, terminal, preview, Git and runtime to be composable peer panes rather than features organized around Canopy's existing product navigation.

### Extensibility mismatch

Canopy's contributor documentation explicitly states that it is extensible through deliberate typed seams, **but is not a general plugin host**.

Pane's current architecture direction wants a stronger provider model:

```text
AgentProvider
RuntimeProvider
GitProvider
PreviewProvider
EditorProvider
```

That does not make Canopy incompatible, but it means Pane would eventually modify a central architectural assumption rather than simply add plugins.

### Upstream churn

Canopy is pre-1.0 and actively changing. A fork that attempts to remain continuously mergeable while Pane simultaneously rewrites product composition would pay recurring conflict cost.

---

## 5. Option C — detached Canopy seed

This is the current recommendation.

The model is:

```text
Canopy reviewed commit
        ↓
one-time Pane seed/import
        ↓
retain required MIT notices
        ↓
remove non-Pane product surface
        ↓
rename/reframe domain around Pane
        ↓
introduce Pane providers
        ↓
Pane evolves independently

Upstream Canopy
        ↓
monitor
        ↓
selectively port/cherry-pick useful fixes
```

This differs from both alternatives.

It is **not**:

```text
start a blank Tauri repo and reimplement everything
```

and it is **not**:

```text
merge Canopy main into Pane forever
```

Canopy becomes a high-quality MIT-licensed seed implementation for solved native primitives, while Pane becomes responsible for its own product architecture immediately after the seed point.

### Why this is the best trade today

Pane gets to reuse high-risk commodity infrastructure:

- Tauri/native application foundation
- PTYs
- child-process lifecycle
- xterm integration
- filesystem/watchers
- Git/worktree plumbing
- Monaco/LSP integration
- run/process/port state
- embedded local preview
- lifecycle/cleanup patterns
- security boundaries

without committing to Canopy's complete long-term product roadmap.

This makes the engineering effort focus earlier on what Pane actually needs to invent:

- one persistent developer workspace
- better pane composition
- unified runtime topology
- Docker/Compose integration
- provider abstractions
- cross-surface shared state
- low-context-switch Git/ship loop

---

## 6. Bake-off scorecard

Scores are architecture/source-level estimates, not measured runtime benchmarks.

| Criterion | Independent core | Permanent Canopy fork | Detached Canopy seed |
|---|---:|---:|---:|
| Time to golden-path prototype | 3/10 | 10/10 | **9/10** |
| PTY/process implementation risk | 4/10 | 9/10 | **9/10** |
| Embedded preview implementation risk | 3/10 | 9/10 | **9/10** |
| Git/worktree starting point | 4/10 | 9/10 | **9/10** |
| Agent CLI starting point | 4/10 | 9/10 | **9/10** |
| Pane domain purity on day one | **10/10** | 5/10 | 7/10 |
| Ability to prune unrelated features | **10/10** | 4/10 | **9/10** |
| Upstream merge burden | **10/10** | 3/10 | 8/10 |
| Provider/plugin architecture freedom | **10/10** | 5/10 | **9/10** |
| Short-term implementation efficiency | 3/10 | **10/10** | **9/10** |
| Long-term product independence | **10/10** | 5/10 | **9/10** |

### Overall

**Independent core:** cleanest architecture, worst near-term leverage.  
**Permanent fork:** fastest start, highest structural/upstream baggage.  
**Detached seed:** best current balance.

---

## 7. Proposed keep / rework / prune strategy

A detailed first-pass map lives in `spikes/foundation-bakeoff/CANOPY_SEED_KEEP_PRUNE.md`.

The principle is:

### Keep first

Native primitives that are expensive and already aligned with Pane:

- Tauri/Rust shell
- PTY/process lifecycle
- filesystem scoping/watchers
- Git/worktree plumbing
- Monaco/LSP substrate
- xterm substrate
- browser/preview proxy
- run/server/port model
- split-pane primitives
- typed IPC patterns

### Rework early

Areas that are central to Pane's product identity:

- project/workspace domain
- `ProjectView` composition
- navigation/IA
- agent registry abstraction
- persisted pane layout
- run/service model into runtime topology
- command/permission model for providers

### Prune initially

Features not necessary for Pane's first product thesis:

- Remote portal
- team/relay/collaboration
- dictation/audio
- Android tooling
- credential vault/browser password product
- notes/research/provenance products
- tunnel providers
- clipboard-history product
- unrelated Canopy-specific companion workflows

Pruning must be dependency-aware; this list is a product target, not permission to delete modules blindly.

---

## 8. Runtime gate required before importing the seed

The current execution environment did not provide a working Rust/Node/Tauri/Docker build environment and could not clone the upstream repository, so no compile, launch, memory or process-cleanup claims are made here.

Before Pane imports Canopy source, run one controlled test on the target macOS machine.

### Build gate

```sh
git clone https://github.com/FluidWorksApp/canopy-ide.git
cd canopy-ide
git checkout 25c14a3dba5f656b58817993bc6587f499bebd9b

npm install
npm run typecheck
npm test
cargo test --manifest-path src-tauri/Cargo.toml --no-default-features
npm run tauri:dev
```

Use the upstream project's current contributor instructions if they differ from these generic commands.

### Golden-path gate

Using a normal local web repository:

1. Open the repository.
2. Start a shell terminal.
3. Start Codex in another terminal/session.
4. Run the project's dev command.
5. Confirm the process appears as a managed run.
6. Confirm its actual listening port is detected.
7. Open that port in the embedded preview.
8. Modify a file through Codex or the editor.
9. Inspect the resulting Git diff.
10. Switch between surfaces and confirm processes/state remain alive.
11. Close the project/app and verify owned processes are cleaned up as expected.

### Record

- cold launch time
- idle RSS
- RSS with two PTYs + Monaco + preview
- project-open latency
- terminal start latency
- preview open latency
- process cleanup correctness
- any macOS permission/signing friction
- failures in the exact golden path

The detached-seed recommendation becomes an implementation decision only if this gate passes without a fundamental architectural failure.

---

## 9. Decision rule after the macOS gate

### Choose detached Canopy seed if

- Canopy builds reliably on the target machine;
- golden path works substantially as source inspection predicts;
- idle/runtime footprint is acceptable for Pane;
- removing a first unrelated subsystem does not cause extreme cross-cutting breakage;
- `ProjectView` can be progressively replaced rather than rewritten before any Pane UX can ship.

### Fall back to independent core if

- native substrate is too entangled with Canopy-specific product behavior;
- pruning basic unrelated features breaks core execution paths everywhere;
- preview/process/agent systems cannot be separated from Canopy's high-level model;
- runtime footprint is incompatible with Pane's intended always-open desktop role;
- licensing/third-party obligations introduce an unexpected blocker.

---

## 10. Final recommendation

The bake-off changes the confidence level of the previous Canopy spike.

Previously:

> Canopy is fork-worthy for a short-lived prototype; stay reference-first until we know whether the implementation savings are real.

After tracing the actual golden path through Canopy's source architecture:

> **The implementation savings are real enough that a blank-slate Pane core is not currently justified. The preferred direction is a detached Canopy seed, pending one real macOS execution gate.**

The next engineering action should therefore be **Canopy Seed Validation on macOS**, followed immediately by a minimal source import/pruning experiment if the gate passes.
