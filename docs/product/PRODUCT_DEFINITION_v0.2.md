# Pane Product Definition v0.2

**Status:** Locked for M0 implementation  
**Date:** 2026-08-23  
**Product:** Pane

## 1. Product definition

Pane is an open-source, local-first macOS development workspace for developers who increasingly work through coding agents but still need direct visibility into files, diffs, terminals, running services and the application they are building.

Pane is not initially a full IDE and it is not a wrapper around one specific AI provider.

The immediate product promise is:

> A developer can select a local folder, work with Codex in a real terminal, inspect the resulting file changes, run the project, discover the local development server and test it in an integrated browser without leaving Pane.

This is the first product to build. The broader developer-control-plane direction remains possible later, but it must earn its way into the product after this loop works well.

## 2. Product ownership decision

Pane is built from an independent codebase.

Canopy, Veflow, Tempest, VS Code, Zed, Warp and similar products are references for architecture, interaction patterns and edge cases. They are not Pane's product foundation.

For M0:

- do not fork Canopy;
- do not seed Pane from Canopy source;
- do not embed Canopy or rebrand its UI;
- do not shape Pane's navigation around Canopy's product model;
- selected MIT-compatible implementation ideas may be studied or ported later when there is a clear reason and attribution/licensing requirements are satisfied.

The goal is that Pane's architecture, UX and product identity are Pane-owned from the beginning.

## 3. M0 user job

The primary M0 job is:

> “I have a local project. I want to ask Codex to change it, immediately understand what changed, run the project and see the result without bouncing between Terminal, an editor and a browser.”

The user is expected to make relatively few manual code edits. Therefore M0 optimizes for **agent-driven development with human inspection and correction**, not for matching the full depth of VS Code.

## 4. M0 workspace model

M0 deliberately uses the simplest possible mental model:

```text
1 selected local folder = 1 active Pane workspace
```

The workspace owns or observes:

```text
Workspace
├── root path
├── filesystem tree
├── open file / lightweight editor state
├── changed files / diffs
├── PTY terminal sessions
├── child process trees started from those PTYs
├── discovered listening localhost ports
├── server entries
└── integrated browser tabs
```

Git is used as the first source of truth for changed-file/diff presentation when the selected folder is a Git repository. Non-Git folders may still open, but rich Changes behavior is not an M0 requirement for them.

## 5. M0 golden path

The product must make this sequence feel direct:

1. Launch Pane.
2. Choose **Open Folder**.
3. Select a local project path.
4. Pane renders the folder's file tree.
5. Open a file and read or make a small edit.
6. Open a Pane terminal whose CWD is the workspace root.
7. Run `codex`.
8. Give Codex a prompt from the terminal.
9. Codex changes one or more workspace files.
10. Pane automatically updates **Changes**.
11. Select a changed file and inspect its diff inside Pane.
12. In a Pane terminal run `npm run dev`, `pnpm dev`, or another long-running development command.
13. Pane tracks the process tree created from that terminal.
14. Pane discovers listening localhost ports owned by that process tree.
15. The discovered service appears under **Servers** without requiring prior configuration.
16. Select the server and open it in Pane's integrated browser.
17. Continue the prompt → change → review → run → preview loop without leaving the workspace.

This sequence is the M0 acceptance scenario.

## 6. M0 surfaces

### Files

Required:

- display the selected folder as a tree;
- expand/collapse directories;
- open text files;
- reflect filesystem changes made by Codex or other local tools;
- show lightweight changed-state hints where useful.

Not required yet:

- sophisticated workspace search;
- symbol explorer;
- project-wide refactoring;
- advanced file operations.

### Lightweight editor

The editor exists primarily to inspect agent output and make small corrections.

Required:

- syntax highlighting;
- line numbers;
- text editing;
- save;
- unsaved-state indication;
- basic find;
- safe handling of external file changes.

Monaco is the initial editor choice.

Not required yet:

- extension marketplace;
- debugger;
- advanced IntelliSense parity with VS Code;
- code actions/refactoring depth;
- test explorer.

### Terminal / Codex

Terminal is a first-class M0 surface.

Required:

- real PTY semantics;
- interactive TUI support;
- correct workspace CWD;
- resize and scroll without corrupting full-screen CLIs;
- support for arbitrary local shell commands;
- `codex` must run as the user's actual local Codex CLI, not through a Pane-specific imitation layer.

Pane should not parse Codex output into a proprietary agent protocol for M0. The first integration boundary is the terminal/process/filesystem relationship.

### Changes / Diff

Changes is the primary human-review surface.

Required for Git workspaces:

- changed-file list;
- added/modified/deleted state;
- diff view;
- refresh automatically after Codex/user edits;
- distinguish normal file opening from diff inspection.

Stage/commit/push are useful later but are not required to complete M0.

### Servers

Servers is mandatory in M0.

A developer should not need to register `npm run dev` in settings before Pane can see it.

Required behavior:

```text
Pane terminal
$ pnpm dev
      ↓
Pane-owned PTY/process tree
      ↓
listener discovered on localhost:5173
      ↓
Servers
● localhost:5173
      ↓
Open Preview
```

Each discovered server should retain enough identity to answer:

- which workspace owns it;
- which terminal/process tree started it;
- PID/process identity where available;
- listening port;
- current running/stopped state;
- URL to open.

Configured reusable run commands may be added later, but automatic discovery is the baseline behavior.

### Integrated Browser

Required:

- open discovered localhost HTTP/HTTPS service inside Pane;
- URL display;
- reload;
- back/forward where supported;
- open externally as an escape hatch;
- keep terminal and workspace state alive while preview is active.

Not required yet:

- full DevTools;
- element picker;
- network inspector;
- agent-driven browser automation;
- screenshot/annotation tooling.

## 7. Initial layout

M0 should favor a simple, Pane-owned layout over an early generic docking framework.

Baseline concept:

```text
┌─────────────────┬─────────────────────────────────────┐
│ FILES           │ EDITOR / DIFF / BROWSER            │
│                 │                                     │
│                 │                                     │
├─────────────────┤                                     │
│ CHANGES         ├─────────────────────────────────────┤
│                 │ TERMINAL                            │
├─────────────────┤                                     │
│ SERVERS         │                                     │
└─────────────────┴─────────────────────────────────────┘
```

The terminal height should be resizable. The main content area may switch among editor, diff and browser during M0.

Multiple arbitrary splits, movable docking panes and persistent custom layouts are intentionally deferred until the core loop proves itself.

## 8. Architecture principles locked for M0

1. **Pane-owned codebase.** No Canopy fork/seed.
2. **Local-first.** The selected path and local tools remain authoritative.
3. **Native capability boundary.** Filesystem/PTY/process/port operations live behind a narrow native boundary rather than directly in presentation code.
4. **Real tools, not replicas.** Run the user's Codex, shell and Git instead of reimplementing them.
5. **Workspace ownership.** Processes and servers must be associated with the workspace that created them.
6. **Automatic observation.** Filesystem changes and listening ports should surface without extra configuration where Pane has enough evidence to infer them safely.
7. **Lightweight editor first.** Human review/correction is more important than full IDE parity in M0.
8. **One coherent loop.** Features are valuable when they reduce context switching between prompt, change, review, run and preview.

## 9. M0 technical foundation

Initial implementation direction:

- macOS first;
- Tauri v2 desktop shell;
- React + TypeScript UI;
- Rust native core;
- xterm.js terminal rendering over a Rust-owned PTY;
- Monaco editor;
- local `git` CLI for status/diff;
- filesystem watchers for external edits;
- process-tree tracking for PTYs created by Pane;
- macOS listening-port inspection for workspace-owned process trees;
- integrated browser surface for localhost previews.

The exact browser-host implementation and exact Rust crates are implementation details and can change without changing the product contract above.

## 10. Explicit non-goals for M0

Do not implement these during M0 unless they become necessary to make the golden path work:

- Docker/Compose management;
- GitHub/PR/CI integration;
- Git worktrees;
- multiple simultaneous workspaces;
- Claude/OpenCode-specific adapters;
- remote development;
- cloud agents;
- mobile companion;
- collaboration/team features;
- extension marketplace/VS Code compatibility;
- advanced LSP/refactoring features;
- debugger/test explorer;
- generic process manager for unrelated machine processes;
- advanced browser DevTools;
- highly configurable dock/split layout system.

## 11. M0 completion gate

M0 is complete only when this can be demonstrated on a real local project:

- [ ] open a folder;
- [ ] browse files;
- [ ] open/edit/save a text file;
- [ ] open a terminal at the workspace root;
- [ ] run Codex interactively;
- [ ] let Codex modify files;
- [ ] see changed files update automatically;
- [ ] inspect a diff in Pane;
- [ ] run `npm run dev` or `pnpm dev` from a Pane terminal;
- [ ] see the resulting local server appear automatically under Servers;
- [ ] open that server in Pane's integrated browser with one action;
- [ ] repeat the prompt → change → review → run → preview loop without an external editor, Terminal.app or browser being required.

Performance, polish and advanced feature breadth matter after this workflow is reliable.

## 12. After M0

Only after the M0 loop is strong should Pane evaluate the next layers, likely in this order:

1. richer multi-terminal/multi-pane layouts;
2. stage/commit/push workflow;
3. reusable run commands and service lifecycle controls;
4. multiple agents/worktrees;
5. Docker/Compose/runtime state;
6. GitHub/PR/CI workflow;
7. richer editor/browser capabilities.

This ordering is intentionally provisional. M0 usage should determine what earns priority next.
