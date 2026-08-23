# Canopy Seed Validation Kit

This kit validates the last unresolved question from Pane's foundation bake-off:

> Can the pinned Canopy source actually support Pane's golden path on a real macOS machine cleanly enough to justify using it as a detached seed?

It is intentionally a **validation harness**, not Pane application code.

## Pinned baseline

- Upstream: `FluidWorksApp/canopy-ide`
- Commit: `25c14a3dba5f656b58817993bc6587f499bebd9b`
- Expected source stack: Tauri v2 + React, Node.js 20+, Rust stable

Do not update the Canopy revision during the baseline run. If a later upstream revision is tested, record it as a separate run.

## What we are testing

The exact golden path is:

```text
Open local repository
        ↓
Open independent terminal
        ↓
Run Codex CLI in another terminal
        ↓
Run `npm run dev`
        ↓
Detect the listening port
        ↓
Open it in embedded Preview
        ↓
Change a file and observe Preview
        ↓
Inspect Git status / diff
        ↓
Stage + commit (+ push if a scratch remote is configured)
        ↓
Explicitly stop sessions/services and verify cleanup
```

The important condition is that the agent, terminal, dev process, preview, files/diff, and Git state can coexist in one Canopy workspace without forcing the normal loop back into separate Terminal/Browser/Git applications.

---

## 1. Run the harness self-check

From the Pane repository root:

```sh
bash -n spikes/canopy-seed-validation/*.sh
./spikes/canopy-seed-validation/check-env.sh
```

`check-env.sh` is deliberately non-installing. It reports what is missing instead of modifying the Mac.

Required for this gate:

- macOS
- Xcode Command Line Tools
- Git
- Node.js 20+
- npm
- Rust stable + Cargo
- Codex CLI
- `lsof`, `ps`, `pgrep`

Docker is **not** required for this validation step.

---

## 2. Prepare the pinned Canopy checkout

```sh
./spikes/canopy-seed-validation/bootstrap.sh
```

Default checkout:

```text
~/.pane-validation/canopy-ide
```

Override it with:

```sh
PANE_VALIDATION_HOME=/some/path ./spikes/canopy-seed-validation/bootstrap.sh
```

The script must finish with this exact HEAD:

```text
25c14a3dba5f656b58817993bc6587f499bebd9b
```

Then install/build using Canopy's own source workflow:

```sh
cd ~/.pane-validation/canopy-ide
npm install
npm run typecheck
npm run test
npm run build
```

If one of these fails, record the failure before changing anything. The baseline should not be patched silently.

---

## 3. Create the deterministic fixture project

```sh
./spikes/canopy-seed-validation/make-fixture.sh
```

Default fixture:

```text
~/.pane-validation/fixture
```

It contains a zero-dependency Node server with:

```sh
npm run dev
```

and listens on:

```text
http://127.0.0.1:4173
```

The server reads `index.html` on every request, so changing the file and refreshing the embedded preview is enough to validate the edit → observe loop without installing a framework.

The fixture is initialized as a local Git repository with one clean baseline commit.

If you want to validate `push`, create or use a disposable GitHub repository and add it manually as the fixture's remote. Do not use an important repository for this test.

---

## 4. Launch Canopy DEV

From the pinned Canopy checkout:

```sh
npm run tauri:dev
```

The first Rust build is not a meaningful cold-start measurement. Let the initial compilation finish, close the app cleanly, then launch it a second time for startup observations.

Record:

- time until the application window is usable
- whether launch produces warnings/errors that affect functionality
- whether permissions/prompts are understandable

Do not optimize anything yet.

---

## 5. Run the golden path

Use `~/.pane-validation/fixture` as the test project.

### A. Workspace / filesystem

- Open the fixture as a Canopy project/component.
- Confirm the file tree is visible.
- Open `index.html`.
- Edit text and save it.
- Confirm external file changes are reflected without corrupting the open buffer.

### B. Independent PTYs

- Open Terminal A and run a harmless command such as `pwd`.
- Open Terminal B separately.
- Confirm both sessions remain alive and independently interactive.
- Resize/switch panes/tabs enough to verify terminal state is retained.

### C. Codex CLI

In one dedicated terminal/session:

```sh
codex
```

Verify:

- the CLI renders correctly in the PTY
- keyboard input works normally
- scrolling/resizing does not corrupt the TUI
- Codex can inspect the fixture checkout
- another terminal can remain active at the same time

A real code change by Codex is useful but not required; the test is primarily PTY/process compatibility.

### D. Dev server + port discovery

In another terminal/run surface:

```sh
npm run dev
```

Expected endpoint:

```text
http://127.0.0.1:4173
```

Verify Canopy surfaces the running service/port without requiring you to manually copy the URL into an external browser.

### E. Embedded Preview

Open port `4173` in Canopy Preview.

Verify:

- preview is visibly embedded in Canopy
- the page loads successfully
- Terminal/Codex remain alive while Preview is open
- edit `index.html`, save, refresh Preview, and see the change
- normal testing does not require Chrome/Safari

### F. Git loop

Make a small edit to `index.html` and verify:

- changed file appears
- unstaged diff is correct
- stage works
- commit works
- branch/status update immediately

If the fixture has a disposable remote, also verify push. If not, mark only the push subtest as `NOT_RUN`, not the entire Git gate.

### G. Coexistence test

Before cleanup, keep all of these alive at once:

```text
Canopy workspace
├── editor/file view
├── Codex CLI session
├── independent terminal
├── `npm run dev`
├── embedded Preview :4173
└── Git changes/diff
```

Spend at least 5 minutes switching among them. The purpose is to detect hidden state loss, focus problems, terminal corruption, preview resets, or surprising resource growth.

---

## 6. Capture snapshots

Find Canopy's process PID with Activity Monitor or let the script discover it.

Explicit PID is preferred:

```sh
./spikes/canopy-seed-validation/snapshot.sh idle <CANOPY_PID>
./spikes/canopy-seed-validation/snapshot.sh repo-open <CANOPY_PID>
./spikes/canopy-seed-validation/snapshot.sh loaded <CANOPY_PID>
```

You may also export:

```sh
export CANOPY_PID=<CANOPY_PID>
```

Snapshots go to:

```text
~/.pane-validation/results/<timestamp>/
```

Each snapshot records:

- root + descendant process list
- total RSS for the tree
- per-process CPU/RSS/elapsed time
- listening TCP ports owned by the process tree
- macOS/hardware context

Treat these as engineering evidence, not benchmark-quality telemetry.

---

## 7. Cleanup validation

First stop the dev server and Codex session using Canopy's intended controls. Then close the test project/app as appropriate.

Run:

```sh
./spikes/canopy-seed-validation/cleanup-check.sh
```

The check only flags likely development processes whose current working directory is under the fixture root. This avoids reporting unrelated Node/Codex processes elsewhere on the machine.

Run it twice:

1. after explicit stop/cleanup inside Canopy
2. after closing Canopy

A deterministic documented persistence/hibernate behavior is acceptable only if Pane could expose ownership and cleanup clearly. An unexplained orphan process is a failure signal.

---

# Acceptance criteria

## P0 — functional gates

All of these must pass for an unconditional seed acceptance:

| Gate | PASS condition |
|---|---|
| Build | Pinned revision installs, typechecks/tests/builds, and `tauri:dev` launches without source patches |
| Workspace/files | Fixture opens and file edits/save/external updates behave safely |
| Multi-PTY | At least two independent terminal sessions remain interactive and stateful |
| Codex PTY | Codex CLI renders and operates correctly in a Canopy PTY |
| Parallel execution | Codex and the dev server can run concurrently without stealing each other's session/state |
| Port discovery | Running fixture port `4173` is surfaced from the workspace |
| Embedded Preview | Local app can be tested inside Canopy without an external browser |
| Edit → observe | Saved UI change can be observed in Preview while other sessions stay alive |
| Git | Status, diff, stage, and commit reflect the fixture accurately |
| Coexistence | Editor + agent + terminal + server + preview + Git remain usable together |
| Cleanup ownership | Explicit stop/cleanup leaves no unexplained fixture-owned agent/dev-server processes |

`push` is strongly preferred but may be `NOT_RUN` if no disposable remote is configured.

## P1 — quality/resource signals

These are not automatic rejection thresholds by themselves, but they must be investigated:

- second-launch time feels materially slow for a local desktop cockpit
- settled idle total RSS for the Canopy process tree exceeds ~1 GB
- sustained settled idle CPU exceeds ~15%
- loaded golden-path process tree exceeds ~3 GB RSS on the test machine
- Preview or terminals noticeably degrade during the 5-minute coexistence test
- repeated filesystem/Git refresh delays exceed a couple of seconds
- normal stop/close requires Activity Monitor or manual `kill`

The numbers are **red-flag thresholds**, not performance targets for Pane.

---

# Decision rule

After the run, copy `RESULT_TEMPLATE.md` to a dated result file and complete it.

### `ACCEPT_SEED`

Use when:

- all P0 gates pass
- no severe lifecycle/security issue appears
- P1 observations are acceptable or clearly optimizable

Next move: import the pinned Canopy source as a detached seed and begin the keep/rework/prune plan.

### `ACCEPT_WITH_PATCHES`

Use when:

- the golden path fundamentally works
- failures are bounded and can plausibly be fixed before product work begins
- the patch list does not undermine PTY, preview, filesystem, Git, or process ownership architecture

Record each required patch and a rough estimate before importing.

### `REJECT_SEED`

Use when any of the following is true:

- core PTY/Codex behavior is unreliable
- embedded Preview/port discovery cannot support the single-workspace loop
- filesystem/Git state is unsafe or materially unreliable
- process ownership/cleanup is fundamentally unsuitable
- more than two core P0 failures require architectural changes rather than small fixes

Next move: retain Canopy as an implementation reference and evaluate selective extraction vs an independent Pane core.

---

## Output to bring back

The useful output from this validation is small:

1. completed `RESULT_TEMPLATE.md`
2. snapshot files from `~/.pane-validation/results/...`
3. relevant Canopy terminal/build logs for any failed gate
4. screenshots only when they clarify a UI/focus/layout failure

With those four things, the seed decision can be finalized without another broad research round.
