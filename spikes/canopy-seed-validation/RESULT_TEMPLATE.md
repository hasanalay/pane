# Pane — Canopy Seed Validation Result

**Run date:** YYYY-MM-DD  
**Tester:**  
**Machine:**  
**macOS:**  
**Architecture:** Apple Silicon / Intel  
**Memory:**  
**Canopy commit:** `25c14a3dba5f656b58817993bc6587f499bebd9b`  
**Node:**  
**Rust:**  
**Codex CLI:**  
**Pane validation branch/commit:**  

## Final decision

Choose one:

- [ ] `ACCEPT_SEED`
- [ ] `ACCEPT_WITH_PATCHES`
- [ ] `REJECT_SEED`

**Decision summary:**


## Build / launch

| Check | Result | Notes |
|---|---|---|
| `npm install` | PASS / FAIL | |
| `npm run typecheck` | PASS / FAIL | |
| `npm run test` | PASS / FAIL | |
| `npm run build` | PASS / FAIL | |
| `npm run tauri:dev` | PASS / FAIL | |
| Second launch usable | PASS / FAIL | |

**Second-launch time until usable:**  
**Relevant warnings/errors:**


## P0 functional gates

| Gate | Result | Evidence / notes |
|---|---|---|
| Workspace/files | PASS / FAIL | |
| Two independent PTYs | PASS / FAIL | |
| Codex PTY rendering/input | PASS / FAIL | |
| Codex + dev server parallel | PASS / FAIL | |
| Port 4173 discovery | PASS / FAIL | |
| Embedded Preview | PASS / FAIL | |
| Edit → save → preview | PASS / FAIL | |
| Git status/diff | PASS / FAIL | |
| Git stage | PASS / FAIL | |
| Git commit | PASS / FAIL | |
| Git push | PASS / FAIL / NOT_RUN | |
| All surfaces coexist for 5 min | PASS / FAIL | |
| Explicit stop cleanup | PASS / FAIL | |
| App-exit cleanup semantics | PASS / FAIL | |

## UX observations

### Focus / pane switching


### Terminal behavior


### Preview behavior


### Git review loop


### Places where an external app was still required


### State that was lost unexpectedly


## Resource snapshots

Record the generated file and key values.

| Phase | Snapshot file | Total RSS MB | Summed CPU % | Notes |
|---|---|---:|---:|---|
| Idle | | | | |
| Repo open | | | | |
| Loaded: Codex + terminal + server + preview + Git | | | | |
| After explicit cleanup | | | | |

## Cleanup findings

**After explicit stop:** PASS / FAIL  
**After Canopy exit:** PASS / FAIL

Leftover processes, if any:

```text

```

Were leftovers intentional/documented/persisted sessions, or unexplained orphans?


## Failures and severity

| Failure | Severity (P0/P1) | Repro steps | Likely owner | Estimated patch size |
|---|---|---|---|---|
| | | | | |

## Patch queue required before Pane import

Complete only for `ACCEPT_WITH_PATCHES`.

1. 
2. 
3. 

**Estimated total effort:**


## Foundation decision rationale

Answer briefly:

1. Did Canopy materially reduce the amount of native infrastructure Pane would otherwise need to build?
2. Did any inherited behavior conflict with Pane's single-workspace control-plane thesis?
3. Are the problems isolated enough to prune/refactor after a detached seed import?
4. Is there any reason to prefer selective extraction or a clean Pane core instead?

**Conclusion:**


## Attachments / evidence

- Build log:
- Snapshot directory:
- Screenshots:
- Other notes:
