# Canopy Seed Validation Kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reproducible macOS validation kit that can determine whether the pinned Canopy revision is safe to use as Pane's detached seed foundation.

**Architecture:** Keep the validation harness outside Canopy. Shell scripts prepare a pinned checkout, verify the host toolchain, generate a deterministic scratch project, capture process/resource snapshots, and detect obvious leftover processes. A human checklist validates the UX-specific golden path that cannot be reliably automated from outside the app.

**Tech Stack:** POSIX-ish Bash on macOS, Git, Node.js 20+, npm, Rust stable/Cargo, macOS `ps`/`pgrep`/`lsof`, Codex CLI.

**Spec:** `docs/spikes/2026-08-23-foundation-bakeoff.md`

## Global Constraints

- Target platform for this gate is macOS.
- Canopy revision is pinned to `25c14a3dba5f656b58817993bc6587f499bebd9b`.
- Do not modify the pinned Canopy checkout during baseline validation.
- Do not install system packages automatically.
- Keep the fixture disposable and isolated under `~/.pane-validation` by default.
- Functional golden-path failures take precedence over benchmark numbers.

---

### Task 1: Validation workflow and acceptance gates

**Files:**
- Create: `spikes/canopy-seed-validation/README.md`
- Create: `spikes/canopy-seed-validation/RESULT_TEMPLATE.md`

**Interfaces:**
- Consumes: foundation recommendation from `docs/spikes/2026-08-23-foundation-bakeoff.md`
- Produces: one documented runbook and one normalized result record

- [ ] Document setup, build, launch, golden path, snapshots, cleanup, and decision procedure.
- [ ] Separate P0 functional gates from P1 resource/quality signals.
- [ ] Define explicit `ACCEPT_SEED`, `ACCEPT_WITH_PATCHES`, and `REJECT_SEED` outcomes.
- [ ] Include the exact pinned Canopy SHA and result fields needed for a later architecture decision.

### Task 2: Host and fixture tooling

**Files:**
- Create: `spikes/canopy-seed-validation/check-env.sh`
- Create: `spikes/canopy-seed-validation/bootstrap.sh`
- Create: `spikes/canopy-seed-validation/make-fixture.sh`

**Interfaces:**
- Produces: `~/.pane-validation/canopy-ide` and `~/.pane-validation/fixture` by default

- [ ] `check-env.sh` must fail for non-macOS, missing Git/Node/npm/Rust/Cargo/Codex, Node <20, or missing Xcode command-line tools.
- [ ] `bootstrap.sh` must clone/fetch only `FluidWorksApp/canopy-ide`, checkout the pinned commit detached, and verify `HEAD` exactly.
- [ ] `make-fixture.sh` must create a zero-dependency Node dev server on port `4173`, initialize Git, and make one baseline commit.
- [ ] None of these scripts may use `sudo` or install dependencies.

### Task 3: Runtime observation tooling

**Files:**
- Create: `spikes/canopy-seed-validation/snapshot.sh`
- Create: `spikes/canopy-seed-validation/cleanup-check.sh`

**Interfaces:**
- `snapshot.sh <label> [pid]` writes a timestamped process/resource snapshot.
- `cleanup-check.sh [fixture-root]` returns non-zero when likely leftover development processes still have their CWD under the fixture.

- [ ] Snapshot the Canopy root process plus descendants, total RSS, CPU, elapsed time, and listening ports.
- [ ] Allow explicit PID input and environment override; use process discovery only as fallback.
- [ ] Cleanup check must scope findings by CWD under the fixture root to avoid flagging unrelated Node/Codex processes.

### Task 4: Verification on the target Mac

- [ ] Run `bash -n spikes/canopy-seed-validation/*.sh`; expected: exit 0.
- [ ] Run `./spikes/canopy-seed-validation/check-env.sh`; expected: all required checks PASS.
- [ ] Run `./spikes/canopy-seed-validation/bootstrap.sh`; expected: printed `HEAD` equals the pinned SHA.
- [ ] Run `./spikes/canopy-seed-validation/make-fixture.sh`; expected: clean Git worktree and `npm run dev` serves port 4173.
- [ ] In the Canopy checkout run `npm install`, `npm run typecheck`, then `npm run tauri:dev`; expected: Canopy DEV launches.
- [ ] Execute the manual golden path from the runbook and fill `RESULT_TEMPLATE.md`.
- [ ] Run snapshots at idle, repo-open, loaded-workspace, and post-cleanup phases.
- [ ] Run cleanup check after explicit session/server stop and again after app exit.

### Task 5: Foundation decision

- [ ] If all P0 gates pass and no severe resource/lifecycle red flags exist, record `ACCEPT_SEED`.
- [ ] If P0 passes but bounded fixes are required, record `ACCEPT_WITH_PATCHES` and list patches with estimates.
- [ ] If core PTY, preview, Git, filesystem, or lifecycle behavior fails materially, record `REJECT_SEED` and switch to selective extraction / independent core analysis.
