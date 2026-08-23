# Pane M0 Product Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reset Pane from a Canopy-seed direction to an independent product/codebase and lock the first buildable milestone around folder → Codex → changes → dev server → integrated preview.

**Architecture:** Preserve competitive research as reference material, but remove Canopy-specific prototype code from the active repository surface. Promote a new M0 product spec and ADRs as the source of truth for implementation. Pane owns its workspace model, UI, process model and architecture from the first line of production code.

**Tech Stack:** macOS-first desktop app; Tauri v2; React + TypeScript; Rust native core; Monaco editor; xterm.js terminal; local Git CLI; macOS process/port discovery for M0.

**Spec:** `docs/product/M0_LOCAL_AGENT_WORKSPACE.md`

## Global Constraints

- Pane is an independent codebase; Canopy is reference material only.
- M0 supports one selected local folder as one active workspace.
- Codex runs as the real local CLI inside a PTY; Pane does not replace it with a custom chat protocol in M0.
- Manual editing is intentionally lightweight in M0.
- Changes/diffs are first-class and update after agent or user filesystem edits.
- Processes launched from Pane-owned terminals must be attributable to the workspace.
- Listening localhost ports from workspace-owned process trees must surface under Servers without requiring prior run-command configuration.
- A discovered server must open with one action in an integrated browser surface.
- Docker/Compose, GitHub/PRs, worktrees, remote/cloud, extension hosting and advanced IDE features are out of M0.

---

### Task 1: Replace the active product direction

**Files:**
- Modify: `README.md`
- Create: `docs/product/PRODUCT_DEFINITION_v0.2.md`
- Create: `docs/product/M0_LOCAL_AGENT_WORKSPACE.md`

- [ ] Make M0 the active project stage in the README.
- [ ] Define the minimal workspace loop and explicit non-goals.
- [ ] Make the M0 acceptance scenario the implementation gate.

### Task 2: Lock architecture decisions

**Files:**
- Create: `docs/decisions/ADR-0001-independent-pane-core.md`
- Create: `docs/decisions/ADR-0002-m0-foundation.md`

- [ ] Record that Pane will not fork, seed from or embed Canopy as its product foundation.
- [ ] Record the M0 stack and native/frontend responsibility boundary.
- [ ] Record the process/server discovery rule and integrated-preview requirement.

### Task 3: Demote old Canopy foundation work to history

**Files:**
- Modify: `docs/research/README.md`
- Modify: `docs/spikes/2026-08-23-canopy-architecture-spike.md`
- Modify: `docs/spikes/2026-08-23-foundation-bakeoff.md`
- Delete: `spikes/canopy-docker-runtime/*`
- Delete: `spikes/foundation-bakeoff/*`

- [ ] Keep research conclusions available, but mark seed/fork recommendations as superseded.
- [ ] Remove Canopy-specific executable/prototype artifacts from the active root-level `spikes/` surface.
- [ ] Ensure the README no longer points at those spikes as active work.

### Task 4: Close obsolete validation work

**GitHub:**
- Close PR #1 `spike: add Canopy seed validation kit` without merging.

- [ ] Explain that the validation work was useful for learning, but the product decision changed to an independent Pane core.

### Task 5: Review

- [ ] Search active docs for language that still says detached Canopy seed is the current direction.
- [ ] Verify all active links point to the v0.2/M0 docs.
- [ ] Open a PR from `product/m0-local-agent-workspace` into `main` for review.
