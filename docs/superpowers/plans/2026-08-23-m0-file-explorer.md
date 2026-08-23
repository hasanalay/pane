# M0 File Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load the selected workspace's real filesystem tree lazily and open a text file inside Pane without giving the frontend unrestricted filesystem authority.

**Architecture:** Rust owns the active canonical workspace root and exposes narrow Tauri commands for setting that root, listing one directory level, and reading a bounded UTF-8 text file. React receives only relative paths and renders a lazy file tree; selecting a file opens a read-only code surface in the main content area. Monaco editing/save is deliberately deferred to the next M0 task.

**Tech Stack:** Tauri v2, Rust std::fs, serde, React, TypeScript, Node test runner.

**Spec:** `docs/product/M0_LOCAL_AGENT_WORKSPACE.md`

## Global Constraints

- macOS first.
- Exactly one active workspace.
- Pane remains an independent codebase; do not import Canopy source.
- Filesystem authority stays in Rust.
- Frontend filesystem requests use workspace-relative paths only.
- Reject paths that escape the active workspace after canonicalization.
- Directory loading is lazy; do not recursively scan the workspace.
- Task 2 reads files but does not implement Monaco editing/save, watchers, Git changes, PTY, servers or browser preview.

---

### Task 2: Native workspace filesystem + lazy explorer

**Files:**
- Create: `src-tauri/src/workspace_fs.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/Cargo.toml`
- Create: `src/workspace/workspaceApi.ts`
- Create: `src/files/fileTree.ts`
- Create: `src/files/fileTree.test.ts`
- Create: `src/files/FileExplorer.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Native `set_workspace_root(root_path: String) -> Result<(), String>`
- Native `list_workspace_directory(relative_path: Option<String>) -> Result<Vec<WorkspaceEntry>, String>`
- Native `read_workspace_text_file(relative_path: String) -> Result<String, String>`
- TS `WorkspaceEntry = { name: string; relativePath: string; kind: "file" | "directory" }`
- TS `FileTreeNode = WorkspaceEntry & { children?: FileTreeNode[]; expanded?: boolean; loading?: boolean }`

- [ ] **Step 1: RED — define frontend tree behavior**

Add Node tests proving:
- inserting directory children only updates the targeted directory;
- directories sort before files, then case-insensitively by name;
- collapsing a directory preserves its previously loaded children.

Run: `npm test`
Expected: FAIL because `fileTree.ts` does not exist yet.

- [ ] **Step 2: GREEN — implement pure tree helpers**

Implement the minimum immutable helpers required by `FileExplorer`.

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 3: Add native workspace boundary tests and implementation**

In `workspace_fs.rs`, add unit tests for relative-path validation and implement canonical workspace ownership, lazy directory listing and bounded UTF-8 file reads. Symlinks that resolve outside the active root must not be traversable.

Native verification command on a Rust host:

```sh
cargo test --manifest-path src-tauri/Cargo.toml
```

- [ ] **Step 4: Wire Tauri IPC**

Register workspace state and the three native commands in `src-tauri/src/lib.rs`; add `serde` derive support.

- [ ] **Step 5: Build the lazy File Explorer**

After folder selection:
- set the native workspace root;
- load root entries;
- expand directories on demand;
- show loading/error state without destroying already loaded nodes;
- open a file by calling `read_workspace_text_file`.

- [ ] **Step 6: Show selected text file in main content**

Replace the workspace-ready placeholder with a simple read-only code surface showing file path and contents. Preserve the terminal placeholder below it.

- [ ] **Step 7: Verify on macOS host**

Run:

```sh
npm test
npm run typecheck
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri:dev
```

Manual gate:
- open a real repo;
- root entries render;
- directory expand/collapse works;
- nested directory loads lazily;
- clicking a UTF-8 text file shows its contents;
- attempting an unsupported/binary/oversized file produces a contained UI error rather than crashing Pane.
