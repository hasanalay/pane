# M0 PTY Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the terminal placeholder with a real workspace-scoped PTY that can run Codex unchanged inside Pane.

**Architecture:** Rust owns PTY creation, shell process lifecycle, input, output and resize. Tauri Channels stream ordered terminal output to React. xterm.js renders the terminal and forwards keyboard input; the PTY cwd comes only from the canonical active workspace state.

**Tech Stack:** Tauri v2, Rust, portable-pty, React, TypeScript, xterm.js, @xterm/addon-fit.

**Spec:** `docs/product/M0_LOCAL_AGENT_WORKSPACE.md`

## Constraints

- Work directly on `dev`.
- One workspace terminal is enough for this slice.
- Codex runs as its normal CLI/TUI; no API/chat wrapper.
- Do not implement Git Changes, server discovery or integrated browser here.
- Terminal output uses Tauri Channel rather than global events.

## Verification

Automated Dev CI:

```sh
npm install
npm test
npm run typecheck
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

Manual acceptance is recorded in `docs/development/MANUAL_CHECKS.md` and verifies `pwd`, `git status`, resize behavior, Codex TUI input and cleanup on workspace replacement.
