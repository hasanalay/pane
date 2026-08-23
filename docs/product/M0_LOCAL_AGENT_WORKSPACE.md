# M0 — Local Agent Workspace

**Status:** Implementation scope locked  
**Date:** 2026-08-23

## Goal

Build the smallest Pane that proves the core product loop:

```text
folder → Codex → file changes → diff → dev server → integrated preview
```

M0 is not a general developer control plane yet. It is a focused local coding workspace designed around agent-driven development.

## User story

As a developer, I can choose a local project folder, run Codex inside Pane, inspect the files Codex changed, start the project from a Pane terminal, see the discovered local server and open the running application inside Pane.

## Primary workflow

### 1. Open workspace

- Launch Pane.
- Click **Open Folder**.
- Select a local folder.
- Pane stores that path as the active workspace root.
- The file explorer loads from that root.

M0 supports exactly one active workspace.

### 2. Inspect/edit files

- Clicking a text file opens it in the main content area.
- Monaco provides syntax highlighting, line numbers, basic find, editing and save.
- External filesystem modifications trigger a refresh signal.
- Pane must not silently overwrite unsaved local editor content when an external change is detected.

### 3. Open terminal

- Open a PTY-backed terminal.
- The PTY starts with `cwd = workspace.rootPath`.
- Shell commands behave like a normal local terminal.
- TUI applications must receive correct resize/input semantics.

### 4. Run Codex

From the Pane terminal:

```sh
codex
```

M0 treats Codex as a normal interactive CLI process. Pane does not require a separate API key or custom chat layer.

The user can type prompts directly into the Codex TUI.

### 5. Observe changes

When Codex modifies workspace files:

- filesystem observation notices changes;
- Git status is refreshed/debounced;
- changed files appear under **Changes**;
- selecting a changed file opens a diff;
- the user can return to the normal editor view for that file.

For M0 the expected repository source of truth is local Git.

### 6. Start a dev server

From any Pane-owned terminal:

```sh
npm run dev
```

or:

```sh
pnpm dev
```

Pane must not require the command to be preconfigured.

The PTY/process subsystem records the process tree spawned from that terminal. A port-observer inspects that owned process tree for listening TCP ports.

### 7. Surface Servers

A discovered listener becomes a workspace server entry, for example:

```text
SERVERS
● localhost:5173
  from: pnpm dev
```

Minimum server state:

```ts
type WorkspaceServer = {
  id: string;
  workspaceId: string;
  terminalId: string;
  rootPid: number;
  owningPids: number[];
  port: number;
  protocol: "http" | "https";
  host: "localhost";
  status: "running" | "stopped";
  discoveredAt: number;
};
```

The actual implementation may use Rust structs and serialized DTOs; the model above defines the UI contract.

### 8. Open integrated preview

Clicking a running server opens the main content area as a browser/preview surface.

Minimum browser controls:

- current URL;
- reload;
- back;
- forward;
- open externally.

The application must remain inside Pane for the normal test loop.

## Baseline screen model

```text
┌──────────────────┬────────────────────────────────────────┐
│ FILES            │                                        │
│                  │ EDITOR / DIFF / BROWSER                │
│                  │                                        │
├──────────────────┤                                        │
│ CHANGES          ├────────────────────────────────────────┤
│                  │ TERMINAL                               │
├──────────────────┤                                        │
│ SERVERS          │                                        │
└──────────────────┴────────────────────────────────────────┘
```

Rules:

- left rail is workspace state, not app-wide navigation;
- terminal remains mounted when editor/diff/browser changes;
- main content switches between editor, diff and browser for M0;
- terminal vertical size is resizable;
- no generic drag/drop docking engine in M0.

## M0 domain boundaries

### Workspace

Owns:

- root path;
- open file state;
- editor buffers;
- terminal session IDs;
- changed-file state;
- discovered server state;
- preview state.

### Filesystem

Native responsibilities:

- read directory;
- read/write file;
- watch workspace paths;
- emit safe change events.

UI responsibilities:

- tree presentation;
- editor buffer reconciliation;
- changed-state indicators.

### Terminal / Process

Native responsibilities:

- spawn PTY shell;
- read/write terminal bytes;
- resize PTY;
- own process lifecycle;
- identify descendant process tree;
- clean up owned PTYs/processes when appropriate.

UI responsibilities:

- xterm rendering;
- terminal tabs/surface state;
- input/focus.

### Changes

Native/service responsibilities:

- run local Git status/diff commands against workspace root;
- return structured changed-file metadata and diff text.

UI responsibilities:

- list changes;
- render diff;
- refresh after filesystem changes.

### Servers

Native responsibilities:

- inspect Pane-owned process trees;
- determine listening TCP ports;
- emit server started/stopped transitions;
- avoid claiming unrelated machine listeners.

UI responsibilities:

- show workspace server list;
- show status/port;
- open preview.

### Browser

Native/desktop responsibilities:

- host an integrated local web preview safely;
- keep preview privileges separate from filesystem/process APIs.

UI responsibilities:

- navigation controls;
- URL state;
- switching main content to preview.

## Important server-discovery rule

Pane intentionally differs from Canopy's configured-run-first behavior for M0.

A process started manually inside a Pane terminal is still Pane-owned enough to observe:

```text
Terminal command
      ↓
PTY root process
      ↓
child/descendant process tree
      ↓
listening socket
      ↓
WorkspaceServer
```

This automatic path is required.

Later Pane may add named/reusable Run Commands, but that becomes a convenience layer over the same process/server model rather than a prerequisite for discovery.

## Error states M0 must handle

### Folder unavailable

If the workspace folder is deleted/moved or permission is lost, Pane must show an explicit workspace error rather than silently operating against another directory.

### External file modification

If a file with unsaved editor content changes on disk, Pane must surface a conflict/reload choice. It must not silently discard the user's buffer.

### Terminal process exit

The terminal should remain readable after a foreground process exits. PTY/session state must not crash the workspace.

### Server stops

When the owning listener disappears, the server entry must transition to stopped or be removed deterministically. A stale green “running” entry is not acceptable.

### Port reused by unrelated process

Server identity must be tied to the owned process tree, not only to the port number. If the owned process dies and another app later binds the same port, Pane must not treat the new process as the same workspace server.

### Preview cannot load

The browser surface must show an explicit load/error state and allow retry/reload/open externally.

## M0 acceptance test

Use a local Git project that can run a development server.

### Gate A — Workspace

- [ ] Open folder.
- [ ] Correct file tree appears.
- [ ] Open text file.
- [ ] Edit/save works.

### Gate B — Terminal/Codex

- [ ] Terminal starts at workspace root.
- [ ] `codex` launches correctly.
- [ ] Codex TUI accepts input and survives resize.
- [ ] Codex can modify workspace files.

### Gate C — Changes

- [ ] Codex change appears automatically.
- [ ] Changed-file metadata is correct.
- [ ] Diff is viewable inside Pane.
- [ ] Editor can open the changed file normally.

### Gate D — Server discovery

- [ ] Run `npm run dev` or `pnpm dev` in a Pane terminal.
- [ ] No prior server configuration is required.
- [ ] Pane discovers the listening localhost port from the owned process tree.
- [ ] Server appears under Servers.
- [ ] Stopping the process updates/removes the server state.

### Gate E — Integrated preview

- [ ] One action opens the discovered server inside Pane.
- [ ] Page renders.
- [ ] Reload works.
- [ ] Terminal stays alive while browser is active.
- [ ] Code/agent change can be observed by refreshing the preview.

### Gate F — End-to-end loop

Complete at least one full cycle:

```text
Codex prompt
→ file modification
→ diff inspection
→ dev server
→ integrated preview
→ second Codex prompt
```

No external editor, Terminal.app or browser should be required for the cycle.

## M0 exit criteria

M0 is done when all Gates A–F pass reliably on macOS and the implementation has no known process-lifecycle or file-safety defect that could cause lost work or orphaned workspace-owned processes.

Everything else is backlog.
