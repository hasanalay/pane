# Canopy Seed — Keep / Rework / Prune Map

**Purpose:** first-pass decomposition for a possible one-time Canopy source seed into Pane.

This is not a deletion checklist. It is a product/architecture ownership map to guide a real source import experiment.

## KEEP — high-value substrate

These areas solve difficult native/platform problems and align closely with Pane's requirements.

### Native application boundary

- Tauri v2 application shell and Rust composition-root patterns
- typed Tauri IPC wrappers
- blocking-operation boundary
- application lifecycle / cleanup patterns

### PTY and process substrate

- PTY creation and ownership
- raw terminal streaming
- resize/input handling
- backpressure and bounded scrollback
- exit/teardown semantics
- process-tree telemetry where useful

### Filesystem substrate

- workspace-root registration
- path containment/scoping
- filesystem reads/writes required by editor/workspace
- file and Git watchers

### Source-control substrate

- system Git execution
- credential/helper compatibility
- worktree operations
- status/diff/stage/commit/push primitives needed by Pane
- Git invalidation patterns

### Editor substrate

- Monaco integration
- language-server process ownership
- LSP transport
- editor/file change protection patterns

### Terminal UI substrate

- xterm.js integration
- terminal session rendering
- terminal-group/split primitives that can be reused without preserving Canopy IA

### Run / server substrate

- configured run-command execution
- association between PTY, CWD and run
- detected listening ports
- running/stopped/failed state
- ad-hoc run representation
- start/stop/restart lifecycle

### Preview substrate

- embedded/native browser foundation
- local reverse proxy
- WebSocket/HMR handling
- navigation and preview lifecycle
- separation between preview content and privileged desktop APIs

These are the parts where reimplementation risk is high but product differentiation is low.

---

## REWORK EARLY — Pane-owned product architecture

These areas must become Pane concepts before a fork grows substantially.

### Workspace domain

Pane's top-level object is the persistent development **Workspace**.

The model should converge toward:

```text
Workspace
├── Repository / Worktree
├── Files / Editor
├── AgentSession[]
├── TerminalSession[]
├── Process[]
├── Service[]
├── Endpoint[]
├── Preview[]
├── GitState
├── RuntimeTopology
└── PaneLayout
```

Canopy's project/component concepts may remain temporarily as migration scaffolding, but Pane should not let them become permanent constraints if they do not match this model.

### `ProjectView` / composition root

This is the highest-priority frontend refactor candidate.

Goals:

- make panes composable peers;
- reduce feature dispatch concentrated in one large component;
- move domain behavior into framework-free owners/stores;
- make stateful pane lifetime explicit;
- persist layout per workspace;
- allow terminal, agent, preview, editor/diff and runtime views to coexist rather than be page destinations.

### Navigation / information architecture

Pane should organize around:

- current workspace context;
- active work/process state;
- things requiring attention;
- quick pane composition;

not around inherited Canopy feature categories.

### Agent abstraction

Keep the useful real-CLI/PTTY behavior, but move toward:

```text
AgentProvider
├── detect
├── capabilities
├── launch
├── resume?
├── lifecycle
└── metadata
```

Codex, Claude Code, OpenCode and generic CLI adapters should be peers.

### Runtime abstraction

Introduce before adding substantial Docker UI:

```text
RuntimeProvider
├── detect
├── projects
├── services
├── containers/resources
├── events
├── logs
├── stats
├── start
├── stop
└── restart
```

Docker Desktop and OrbStack can initially converge through Docker compatibility. Provider-specific capabilities can remain optional.

### Run → runtime topology

Canopy's run/server model is a good starting point but Pane should eventually join:

```text
local process
+ Compose service
+ container
+ port
+ health
+ log stream
+ preview endpoint
```

into one workspace runtime view.

### Git surface

Keep the underlying primitives but design the user flow specifically around:

```text
Review → Stage → Commit → Push → PR → checks
```

without requiring a separate Git application or website for the common path.

### Permission model

Pane needs explicit operation classes for agents and UI integrations, especially when runtime access is added.

Examples:

- read workspace
- edit workspace
- run command
- inspect runtime
- read logs
- start/restart service
- stop service
- push Git changes
- destructive runtime mutation

---

## PRUNE INITIALLY — outside the first Pane thesis

These areas should not automatically survive a source seed merely because they already exist.

### Remote / portal

- Canopy Remote SPA
- Remote WebSocket/RPC product surface
- phone/browser remote UI

Reason: useful future possibility, but unrelated to proving Pane's local cockpit.

### Team / collaboration / relay

- encrypted peer relay
- team chat
- file transfer/collaboration
- collaborative editing protocol

Reason: materially expands networking, security and UX scope.

### Notes / research / provenance products

- notes UI/store
- research jobs and research UI
- provenance product surfaces

Reason: not part of Pane's first development loop. Revisit only if developer memory/context becomes a product pillar.

### Credential vault product

- browser password vault
- KeePass import
- related agent credential-fill UX

Reason: high-security surface and not necessary for local development orchestration.

Pane should initially reuse existing agent/Git credential stores and macOS Keychain only where Pane itself must store secrets.

### Dictation / audio

- speech models
- ONNX runtime
- microphone capture
- audio restoration

Reason: significant binary/dependency footprint with no relationship to Pane's core thesis.

### Android device tooling

- emulator/device discovery
- Android screenshots/UI tree/input/logcat/APK lifecycle

Reason: specialized mobile-development feature. It can return later as a provider/integration if demand exists.

### Clipboard-history product

Reason: useful utility but not foundation-level.

### Tunnel providers

- public remote tunnels
- tunnel lifecycle infrastructure used only by pruned Remote/team features

### Canopy-specific Companion product

The generic idea of an app-level assistant may be useful later, but Pane should not inherit a high-level companion product before its workspace/agent model is settled.

### Search/indexing not required by retained surfaces

Canopy's broad FTS/search infrastructure should be evaluated after pruning. Keep only the search required for Pane's actual workspace UX rather than carrying every source/index by default.

---

## DEPENDENCY-PRUNING RULES

The seed experiment should remove features in dependency-safe vertical slices rather than deleting files by category.

For every candidate removal:

1. identify Rust managed state;
2. identify Tauri commands/events;
3. identify React/portal consumers;
4. identify persistent data and migrations;
5. identify Cargo/npm dependencies used only by the subsystem;
6. remove tests and docs only after behavior is removed;
7. run typecheck/tests/build after each slice.

A feature is considered successfully pruned only when its unused dependency graph is also gone.

## FIRST PRUNING EXPERIMENT

If the macOS Canopy execution gate passes, do not immediately remove everything above.

Use one representative vertical slice first:

> **Remove dictation/audio from the seed while retaining the golden path.**

Why this is a useful test:

- it is clearly non-core to Pane;
- it touches Rust features/dependencies/build packaging;
- it provides a concrete measure of how cleanly Canopy product features can be detached;
- failure would expose hidden coupling before Pane commits to a large fork.

Success criteria:

- application builds;
- golden path still works;
- dictation-specific Cargo dependencies/assets are absent;
- no dead UI/settings remain;
- no unrelated subsystem needs invasive modification.

If this first slice is clean, proceed to Remote/team and other major product-scope removals.
