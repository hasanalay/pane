# ADR-0002 — M0 Technical Foundation

**Status:** Accepted  
**Date:** 2026-08-23

## Context

Pane M0 has one narrow acceptance loop:

```text
Open Folder
→ Files
→ PTY terminal
→ Codex
→ Changes / Diff
→ npm/pnpm dev server
→ automatic port discovery
→ integrated browser
```

The implementation needs deep local-machine capabilities while keeping the UI fast to iterate and independently designed.

## Decision

### Platform

M0 targets **macOS first**.

Cross-platform abstractions are welcome where they are cheap, but M0 must not delay on Windows/Linux parity.

### Desktop foundation

Use **Tauri v2** as the desktop application shell.

Use **React + TypeScript** for the presentation/workspace layer.

Use **Rust** for privileged/native capabilities.

This is a Pane-owned Tauri application, not a Canopy fork.

### Native boundary

Rust owns capabilities that touch local machine authority or process lifecycle:

```text
Rust native core
├── workspace filesystem access
├── filesystem watching
├── PTY spawn/read/write/resize
├── process ownership and teardown
├── descendant process discovery
├── listening-port discovery
├── local Git command execution
└── integrated-preview native plumbing where required
```

React owns:

```text
React workspace UI
├── file tree presentation
├── editor buffers/view state
├── terminal rendering/focus
├── Changes/diff presentation
├── Servers presentation
├── browser controls
└── workspace layout state
```

Native operations cross a narrow typed Tauri IPC boundary.

### Terminal

Use **xterm.js** for terminal rendering.

The backing terminal must be a real native PTY. M0 must support interactive/full-screen TUIs such as Codex correctly, including resize and scrolling semantics.

Pane does not create a custom Codex chat integration for M0. The user's installed `codex` binary is run directly inside the workspace PTY.

### Editor

Use **Monaco** for a deliberately lightweight editor.

M0 editor priorities:

- read agent-generated code;
- make small manual corrections;
- syntax highlighting;
- line numbers;
- find;
- save;
- safe external-change handling.

Do not build extension hosting, debugger/test explorer or full VS Code parity in M0.

### Changes / diff

Use the user's local **Git CLI** as the initial source of truth for Git workspaces.

M0 needs structured wrappers for:

- repository detection;
- status/changed files;
- file diff.

Stage/commit/push are not required for M0 completion.

Filesystem watchers trigger/debounce refreshes after Codex or other tools change files.

### Process ownership

Every terminal spawned by Pane has a stable `terminalId` and root process/PTY identity.

Pane tracks descendants of Pane-owned terminal processes so it can answer:

> Which processes were started as part of this workspace/terminal context?

Do not build a general machine-wide process manager in M0.

### Automatic server discovery

Server discovery is a core M0 requirement and must **not** depend on prior run-command configuration.

When a command such as:

```sh
npm run dev
```

or:

```sh
pnpm dev
```

runs inside a Pane-owned terminal, the native core:

1. identifies the terminal's owned process tree;
2. checks that tree for listening TCP sockets;
3. creates/updates workspace server records for relevant local listeners;
4. emits start/stop changes to the UI.

On macOS, initial discovery may use operating-system process/socket inspection such as `lsof` while preserving a provider boundary so the implementation can change later.

Server identity is not only `port`. It must be associated with the owning process tree to avoid treating an unrelated process that later reuses the same port as the same workspace server.

### Integrated browser

M0 includes an integrated browser/preview surface for discovered localhost HTTP/HTTPS services.

Required controls:

- URL display;
- reload;
- back/forward when available;
- open externally.

The browser content must not inherit arbitrary filesystem/process authority from Pane's native APIs.

The exact implementation (Tauri child webview/native webview/proxy approach) is intentionally not fixed by this ADR; choose the smallest safe mechanism during implementation.

### Layout

Do not start M0 with a generic docking framework.

Baseline layout:

```text
left workspace rail: Files / Changes / Servers
main content: Editor OR Diff OR Browser
bottom: resizable Terminal
```

The terminal stays mounted while main content switches.

Generic movable panes, arbitrary split trees and persisted custom layouts are post-M0.

## Explicitly deferred

M0 does not include:

- Docker/Compose runtime control;
- GitHub/PR/CI integration;
- worktrees;
- multiple simultaneous workspaces;
- remote/cloud development;
- Claude/OpenCode-specific adapters;
- VS Code extension compatibility;
- advanced IDE/LSP capabilities;
- debugger/test explorer;
- advanced browser DevTools;
- generic machine process management.

## Architecture shape

The first production code should trend toward these bounded owners:

```text
App
└── WorkspaceController
    ├── FileService
    ├── GitService
    ├── TerminalService
    ├── ProcessObserver
    ├── ServerDiscoveryService
    └── PreviewService
```

Frontend projections should not become the authority for native resources.

## Validation rule

Architecture is accepted only if the end-to-end M0 gate in `docs/product/M0_LOCAL_AGENT_WORKSPACE.md` can be demonstrated reliably on a real macOS project.

If an implementation choice makes the golden path materially harder, the choice can be replaced without reopening ADR-0001's independent-codebase decision.
