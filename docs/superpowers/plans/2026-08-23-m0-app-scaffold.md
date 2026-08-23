# M0 App Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the first runnable Pane-owned macOS desktop application and prove the first M0 slice: Open Folder → active workspace root.

**Architecture:** Start from a clean Tauri v2 application owned by Pane. React + TypeScript renders the workspace shell; Rust/Tauri owns native application authority. Folder selection uses the Tauri dialog plugin behind a small injected workspace service so the product behavior is testable without coupling tests to Tauri.

**Tech Stack:** Tauri v2, Rust, React, TypeScript, Vite, Node test runner.

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
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles.css`
- Create: `src/workspace/workspace.ts`, `src/workspace/workspace.test.ts`, `src/workspace/selectWorkspaceDirectory.ts`
- Create: `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`
- Create: `.gitignore`

**Interfaces:**
- Produces: `Workspace { rootPath: string; name: string }`
- Produces: `chooseWorkspace(selectDirectory: () => Promise<string | null>): Promise<Workspace | null>`
- Produces: `selectWorkspaceDirectory(): Promise<string | null>` Tauri adapter used by the UI.

- [x] **Step 1: Bootstrap only the test/tooling scaffold**

Add Vite/React/TypeScript/Tauri configuration and dependency metadata. The lockfile is intentionally generated on the first networked `npm install` because the execution host used for this implementation cannot reach the npm registry.

- [x] **Step 2: RED — prove the workspace service API does not exist yet**

A Node test dynamically imported the planned workspace module and converted the missing module/export into an assertion failure. The test failed with `actual: undefined`, `expected: function` before production behavior existed.

- [x] **Step 3: GREEN — add the smallest workspace service surface**

Added only the `chooseWorkspace` export returning `null`. The API-existence test passed.

- [x] **Step 4: RED — define Open Folder behavior**

Added tests proving:
- selecting `/Users/dev/example-project` returns `{ rootPath, name: "example-project" }`;
- canceling the native picker returns `null`;
- trailing separators do not produce an empty workspace name.

The behavior run failed 2/3 tests against the stub, as expected.

- [x] **Step 5: GREEN — implement the minimal workspace behavior**

Implemented `chooseWorkspace` independently from Tauri. The behavior run passed 3/3 tests using Node's test runner with TypeScript type stripping.

- [x] **Step 6: Wire the Tauri folder picker and workspace shell**

Use `@tauri-apps/plugin-dialog` to select one directory. The initial UI has an empty state with **Open Folder**; after selection it shows the workspace name/path and placeholder regions for Files, Changes, main content, and Terminal without implementing those later capabilities.

- [ ] **Step 7: Verify frontend quality gates on a networked development host**

Run after `npm install`:
- `npm test`
- `npm run typecheck`
- `npm run build`

The current execution host cannot fetch npm dependencies, so these full dependency-backed gates are not claimed here.

- [ ] **Step 8: Verify Rust/Tauri metadata on a Rust-enabled host**

Run `cargo check --manifest-path src-tauri/Cargo.toml`. The current execution host does not provide `rustc`/`cargo`, so a native build pass is not claimed here.

- [ ] **Step 9: Generate and commit dependency locks after the first successful host build**

Commit the generated `package-lock.json` and `src-tauri/Cargo.lock` after the first networked `npm install` / Cargo resolution.
