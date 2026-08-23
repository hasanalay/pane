# M0 App Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the first runnable Pane-owned macOS desktop application and prove the first M0 slice: Open Folder → active workspace root.

**Architecture:** Start from a clean Tauri v2 application owned by Pane. React + TypeScript renders the workspace shell; Rust/Tauri owns native application authority. Folder selection uses the Tauri dialog plugin behind a small injected workspace service so the product behavior is testable without coupling tests to Tauri.

**Tech Stack:** Tauri v2, Rust, React, TypeScript, Vite, Vitest.

**Spec:** `docs/product/M0_LOCAL_AGENT_WORKSPACE.md`

## Global Constraints

- macOS first.
- Pane remains an independent codebase; do not import Canopy source.
- One selected local folder equals one active M0 workspace.
- Native/local-machine authority stays behind Tauri/Rust/plugin boundaries.
- Do not add terminal, Monaco, Git, server discovery or browser implementation in this task.

---

### Task 1: Bootstrap Pane desktop shell and Open Folder workspace slice

**Files:**
- Create: `package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, TypeScript configs
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles.css`
- Create: `src/workspace/workspace.ts`, `src/workspace/workspace.test.ts`
- Create: `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`
- Create: `.gitignore`

**Interfaces:**
- Produces: `Workspace { rootPath: string; name: string }`
- Produces: `chooseWorkspace(selectDirectory: () => Promise<string | null>): Promise<Workspace | null>`
- Produces: `selectWorkspaceDirectory(): Promise<string | null>` Tauri adapter used by the UI.

- [ ] **Step 1: Bootstrap only the test/tooling scaffold**

Add Vite/React/TypeScript/Vitest/Tauri configuration and dependency metadata. No workspace behavior yet.

- [ ] **Step 2: RED — prove the workspace service API does not exist yet**

Write a Vitest test that dynamically imports `workspace.ts` and converts a missing module/export into an assertion failure rather than a loader error.

Run: `npm test -- --run`
Expected: FAIL because `chooseWorkspace` does not exist.

- [ ] **Step 3: GREEN — add the smallest workspace service surface**

Create the service export so the API-existence test passes without implementing folder-selection behavior.

Run: `npm test -- --run`
Expected: PASS.

- [ ] **Step 4: RED — define Open Folder behavior**

Add tests proving:
- selecting `/Users/dev/example-project` returns `{ rootPath, name: "example-project" }`;
- canceling the native picker returns `null`;
- trailing separators do not produce an empty workspace name.

Run: `npm test -- --run`
Expected: FAIL on behavior.

- [ ] **Step 5: GREEN — implement the minimal workspace behavior**

Implement `chooseWorkspace` and keep path-to-name derivation independent from Tauri.

Run: `npm test -- --run`
Expected: all workspace tests PASS.

- [ ] **Step 6: Wire the Tauri folder picker and workspace shell**

Use `@tauri-apps/plugin-dialog` to select one directory. The initial UI has an empty state with **Open Folder**; after selection it shows the workspace name/path and placeholder regions for Files, Changes, main content, and Terminal without implementing those later capabilities.

- [ ] **Step 7: Verify frontend quality gates**

Run:
- `npm test -- --run`
- `npm run typecheck`
- `npm run build`

Expected: all commands exit 0.

- [ ] **Step 8: Verify Rust/Tauri metadata as far as the execution host permits**

Run `cargo check --manifest-path src-tauri/Cargo.toml` when required system libraries are available. If the host lacks Tauri platform dependencies, record that limitation rather than claiming a native build pass.

- [ ] **Step 9: Commit**

Commit message: `feat: bootstrap Pane M0 workspace shell`
