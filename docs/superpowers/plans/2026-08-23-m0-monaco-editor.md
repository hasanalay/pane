# M0 Monaco Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Pane's plain read-only text viewer with a locally bundled Monaco editor that detects common file languages, syntax-highlights content, allows small edits, and saves existing workspace files through the Rust workspace boundary.

**Architecture:** Monaco is bundled locally with Vite; no CDN/runtime network dependency is allowed. React owns editor state and dirty/save UX. Rust remains the only filesystem write authority and only writes existing UTF-8 text files inside the canonical active workspace root.

**Tech Stack:** Tauri v2, Rust, React, TypeScript, Vite, `monaco-editor` 0.56.x, Node test runner.

**Spec:** `docs/product/M0_LOCAL_AGENT_WORKSPACE.md`

## Global Constraints

- macOS first.
- Pane remains an independent codebase.
- One selected local folder equals one active M0 workspace.
- Monaco must be locally bundled; no CDN loading.
- Filesystem writes remain behind the Rust/Tauri workspace boundary.
- M0 editor supports existing UTF-8 text files up to the existing 2 MiB text-file limit.
- Do not add LSP, autocomplete servers, file watchers, tabs, Git diff or terminal work in this slice.

---

### Task 1: Language detection and Monaco runtime

**Files:**
- Create: `src/editor/language.ts`
- Create: `src/editor/language.test.ts`
- Create: `src/editor/monacoEnvironment.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `languageForPath(relativePath: string): string`

- [ ] **Step 1: RED — define language detection behavior**

Add Node tests for TypeScript/TSX, JavaScript/JSX, JSON, CSS/SCSS, HTML, Markdown, YAML, Python, Rust, Go, shell and unknown plaintext fallback.

- [ ] **Step 2: GREEN — implement deterministic path-based detection**

Use basename/extension mapping only. Do not inspect file contents in M0.

- [ ] **Step 3: Configure Monaco's Vite workers locally**

Follow Monaco's ESM/Vite worker pattern for editor, JSON, CSS, HTML and TypeScript workers. Do not load Monaco from a CDN.

---

### Task 2: Editable Monaco surface

**Files:**
- Create: `src/editor/CodeEditor.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `languageForPath(relativePath)`
- Produces: editor change events and save action including Cmd+S

- [ ] **Step 1: Replace the `<pre>` reader with Monaco**

Create one model per currently open file and dispose editor/model when the open file changes or unmounts.

- [ ] **Step 2: Add dirty-state UX**

Track `content` and `savedContent`. Show language + modified state in the file header and enable Save only while dirty.

- [ ] **Step 3: Add Save and Cmd+S**

Save through the workspace API. A successful save updates `savedContent`; a failed save keeps the editor dirty and surfaces the error.

---

### Task 3: Native save boundary

**Files:**
- Modify: `src/workspace/workspaceApi.ts`
- Modify: `src-tauri/src/workspace_fs.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Produces: `writeWorkspaceTextFile(relativePath: string, content: string): Promise<void>`
- Produces Tauri command: `write_workspace_text_file`

- [ ] **Step 1: Add the frontend write adapter**

Invoke only with an active-workspace relative path and UTF-8 string content.

- [ ] **Step 2: Add the Rust write command**

Reuse the canonical root/path validation. Refuse directories, root escape and content beyond the M0 text limit. Only overwrite an existing file.

- [ ] **Step 3: Register the command in the Tauri handler**

Keep the handler module-qualified.

---

### Task 4: macOS validation

- [ ] `npm install` updates the dependency lock for Monaco.
- [ ] `npm test` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] `cargo test --manifest-path src-tauri/Cargo.toml` passes.
- [ ] `npm run tauri:dev` launches.
- [ ] Open `.ts/.tsx/.json/.css/.md` files and confirm correct syntax highlighting.
- [ ] Modify an existing file, save from the button and Cmd+S, and verify the file changed on disk.
