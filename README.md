# Pane

**Pane** is an open-source, local-first macOS development workspace built around the real agent coding loop.

Pane is developed as an **independent product and codebase**. Canopy, Veflow, Tempest and other tools remain research/reference implementations; Pane does not use Canopy as a fork, seed, embedded product or UI foundation.

## Current milestone — M0 Local Agent Workspace

The first version is intentionally narrow:

> Pick a local folder → work with Codex in a real terminal → see file changes and diffs → run the app → discover its local server → open it inside Pane.

```text
Open Folder
    ↓
Files / lightweight editor
    ↓
Terminal → codex
    ↓
Changes / diff
    ↓
npm run dev / pnpm dev
    ↓
automatic process + port discovery
    ↓
Servers
    ↓
Integrated Browser
```

### M0 must provide

- one selected local folder = one active workspace
- file explorer
- lightweight Monaco-based file viewing/editing
- real PTY-backed terminal
- Codex CLI running unmodified inside that terminal
- automatic changed-file and Git diff visibility
- workspace-owned process tracking
- automatic localhost/listening-port discovery for processes started from Pane terminals
- a single Servers surface for discovered dev servers
- one-click open in an integrated browser/preview surface
- stable workspace state while moving between editor, diff, terminal and preview

### Explicitly not M0

- Docker / Compose control
- GitHub / PR workflows
- worktrees
- multiple simultaneous workspaces
- remote/cloud development
- extension hosting or VS Code compatibility
- debugger/test explorer
- advanced IDE refactoring features
- advanced browser DevTools

## Product principle

Pane should not become “VS Code + Terminal + Browser in one window.” The surfaces must share workspace state.

Examples:

- Codex changes a file → Changes updates automatically.
- `pnpm dev` starts a server → Pane associates the process with the workspace and discovers its port.
- `localhost:5173` appears under Servers → one action opens it inside Pane.
- the terminal, changed files and preview remain part of the same development context.

## Foundation

M0 starts from a clean Pane-owned codebase.

Initial implementation direction:

- **Desktop shell:** Tauri v2
- **UI:** React + TypeScript
- **Native core:** Rust
- **Terminal:** xterm.js over a native PTY
- **Editor:** Monaco, intentionally lightweight in M0
- **Changes:** local Git/status/diff first
- **Server discovery:** Pane-owned PTY/process tree + listening-port discovery
- **Preview:** integrated local browser surface

Native capabilities such as PTY/process lifecycle, filesystem access and port discovery belong behind a narrow Rust/Tauri boundary. React owns workspace presentation and interaction state.

## Source of truth

- [`docs/product/PRODUCT_DEFINITION_v0.2.md`](docs/product/PRODUCT_DEFINITION_v0.2.md) — current product definition
- [`docs/product/M0_LOCAL_AGENT_WORKSPACE.md`](docs/product/M0_LOCAL_AGENT_WORKSPACE.md) — buildable M0 scope and acceptance criteria
- [`docs/decisions/ADR-0001-independent-pane-core.md`](docs/decisions/ADR-0001-independent-pane-core.md) — Pane owns its codebase; Canopy is reference only
- [`docs/decisions/ADR-0002-m0-foundation.md`](docs/decisions/ADR-0002-m0-foundation.md) — M0 technical foundation and boundaries
- [`docs/research/README.md`](docs/research/README.md) — competitive/reference research

Older v0.1 and Canopy foundation-spike documents are retained only as historical decision context and are marked superseded.
