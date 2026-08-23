# Pane Product Definition v0.1

**Status:** Draft / discovery baseline  
**Date:** 2026-08-23  
**Product:** Pane

## 1. Product vision

Pane is an open-source-first, local-first **Developer Control Plane / Developer Cockpit** for developers who want to keep the active development loop inside one persistent workspace.

Pane is not defined as an AI IDE. Its primary product goal is to reduce development context switching by allowing code, agents, terminals, running services, previews, Git state and runtime state to share the same project context.

The intended experience is:

> Codex can be working, the application can be running, the browser can be visible, another terminal can remain active, runtime state can be observable, and the resulting code can be reviewed, committed and pushed without leaving the workspace.

## 2. Product thesis

The top-level product object is the **workspace** — not the editor, not the terminal and not the AI chat.

A workspace should retain the state required to answer:

- What am I editing?
- What are my agents doing?
- What commands are running?
- What services are alive?
- Where can I see the application?
- What changed?
- What can I ship?
- Is my development environment healthy?

The north-star product question is:

> How often does a developer have to leave Pane to complete the normal edit → run → observe → debug → agent → inspect → commit → push loop?

The desired answer should approach zero.

## 3. Core workspace model

Pane should treat the following as peer workspace state rather than unrelated tools:

```text
Workspace
├── Repository
├── Branch / Worktree
├── Files
├── Editor state
├── Agent sessions
├── Terminal sessions
├── Managed processes
├── Detected ports / endpoints
├── Browser / preview tabs
├── Git changes
├── GitHub PR state
├── Compose project
├── Containers
├── Logs
├── Health / runtime state
├── Environment state
└── UI pane/layout state
```

Not every object must be implemented in the first prototype. This model defines the product direction.

## 4. Golden-path acceptance scenario

The first meaningful Pane experience should prove this workflow:

1. Open a local Git repository.
2. Start Codex, Claude Code or another supported CLI agent inside the workspace.
3. Open one or more independent terminal panes.
4. Start the local application, for example with `npm run dev`.
5. Detect the resulting localhost port.
6. Open the application in an embedded preview pane.
7. Keep the agent, terminal, files/diff and preview mounted in the same workspace.
8. Inspect changes.
9. Stage selected changes.
10. Commit.
11. Push.
12. Continue into a PR workflow without reconstructing project context.

A later runtime slice should add visibility into Docker/Compose services and logs without requiring Docker Desktop or another runtime GUI for normal project operations.

## 5. Interaction principle: single app vs. single screen

Pane's promise is not that every tool is permanently visible at the same time.

The stronger requirement is:

> Every active development context remains mounted, recoverable and directly manipulable without crossing an application boundary.

The workspace UI should therefore be pane-oriented rather than page-oriented.

Expected layout behavior includes:

- tabs
- splits
- movable panes
- resize
- pin
- temporary maximize / focus
- restore
- persistent layout per workspace

A traditional navigation model with separate “Agents”, “Git”, “Containers” and “Terminal” pages would reproduce context switching inside the application and is not the desired default interaction model.

## 6. Initial product surfaces

The first validated product slice should concentrate on the active local development loop:

### Repository and files

- Open an existing local Git repository.
- File explorer.
- Lightweight integrated editing and diff inspection.
- External editor escape hatch when deeper IDE functionality is required.

### Agents

- Launch existing local CLI agents rather than forcing one hosted model provider.
- Initial targets can include Codex, Claude Code and OpenCode.
- Agent sessions run against the actual local checkout or isolated worktree.
- Agents are adapters, not the foundation of Pane.

### Terminal and processes

- Multiple independent PTY-backed terminal sessions.
- Managed run processes for long-running dev servers/tests/watchers.
- Process lifecycle should survive ordinary UI pane changes and remain visible as workspace state.

### Preview

- Detect localhost URLs/ports produced by project processes.
- Open them inside an embedded browser pane.
- Keep preview adjacent to the terminal/agent/editor when desired.

### Git

- Status and changed files.
- Diff review.
- Stage/unstage.
- Commit.
- Push.
- Progress toward create/read PR and CI/PR status inside the same workspace.

### Runtime

Runtime is an important Pane differentiator, but it should follow validation of the single-window golden path.

The intended direction is a normalized provider model for Docker-compatible runtimes and later Podman/DevPod-specific capabilities, exposing project-relevant services, ports, health, logs and lifecycle operations as workspace objects.

## 7. Product boundaries / non-goals for the first implementation

Pane should deliberately avoid trying to become all of the following at once:

- a complete VS Code replacement
- a full VS Code extension-host compatibility layer
- a Docker Desktop replacement for every image/volume/network administration task
- a Kubernetes management platform
- a cloud agent hosting platform
- a collaborative project-management suite
- a mobile development companion
- a general remote-development platform across every provider
- a proprietary AI gateway

These may become integrations or later product areas, but they should not obscure the initial product thesis.

## 8. Open-source product direction

Pane should be designed as an independent open-source implementation, not a Veflow clone or compatibility layer.

Current research suggests:

- Veflow is the strongest commercial product reference for agent/worktree/editor/task integration, but is proprietary and not a viable fork base.
- Canopy is the strongest open-source architectural reference currently identified for the local control layer.
- Tempest is a particularly relevant reference for terminal + embedded browser + editor workflows with minimal context switching.
- Superset is a strong orchestration/control reference but its source-available license makes it less attractive as the base of a genuinely open-source core.

A key architectural rule should be:

> Agents, editors and container runtimes are adapters/providers, not foundations of the application.

## 9. Editor direction — working hypothesis

The product should avoid spending the first release rebuilding a complete IDE.

Current preferred validation path:

- Monaco-based editing
- LSP-backed language intelligence where practical
- integrated diff
- integrated terminal
- “Open in VS Code / Zed” escape hatch

Later, evaluate an optional embedded full-editor mode using code-server or OpenVSCode Server.

This is not a final architecture decision; it should be tested against a full-editor embedding spike.

## 10. Control-plane architecture — working hypothesis

Pane should eventually have one headless local control core behind its interfaces.

Conceptually:

```text
Clients
├── macOS Desktop UI
├── Pane CLI
├── MCP server
└── future remote/mobile UI

Local Control Core
├── Workspace manager
├── Event bus
├── Permission broker
├── Local state store
└── Adapters / providers
    ├── Filesystem
    ├── Git
    ├── GitHub
    ├── PTY / Agents
    ├── Process manager
    ├── Browser / Preview
    ├── Docker / runtime
    └── Editor
```

The UI should not directly own shell, filesystem, Docker or credential privileges. Privileged operations should cross a narrow, typed broker boundary.

## 11. Security principles

Pane's value depends on deep local-machine access, so security must be part of the product model.

Principles to preserve during design:

- Local-first by default.
- Reuse existing user toolchains and credentials where possible instead of copying secrets.
- Repository-controlled setup commands require explicit trust.
- Distinguish read operations from modifying/destructive operations.
- Agent permissions should be narrower than the full privileged control-core API.
- Web/preview content should not gain arbitrary filesystem, shell or runtime access.
- Routine container operations should use allow-listed typed commands rather than arbitrary shell execution from the UI.

## 12. What Pane must do better than “tools in one window”

The risk is building:

> VS Code + Terminal + browser + GitHub Desktop + Docker Desktop, but worse.

Pane only becomes a distinct product if these surfaces share state and orchestrate each other.

Examples:

- A terminal prints `http://localhost:3000` → Pane recognizes it as a workspace service → one action opens Preview.
- A worktree starts another dev server → Pane understands its project/worktree ownership and handles port/state independently.
- An agent changes files → Git/diff state updates without the developer opening another tool.
- A Compose service fails → its health/log state is visible in the same workspace in which the developer and agent are working.
- A commit is pushed → PR/CI state can continue in the workspace instead of ending the flow at `git push`.

The differentiation is **shared workspace state and orchestration**, not feature coexistence.

## 13. Immediate validation sequence

Before locking the implementation architecture, Pane should execute the following sequence:

1. **Canopy architecture spike** — build the MIT-licensed project locally, inspect its control-plane boundaries and test a minimal Docker/container integration.
2. **Single-window golden-path prototype** — Explorer + agent PTY + independent shell + managed dev server + embedded preview + Git changes in one project screen.
3. **Editor bake-off** — compare Monaco/LSP against embedded code-server/OpenVSCode for complexity, memory, startup and pane integration.
4. **Runtime-provider spike** — normalize Docker Desktop / OrbStack / Podman project-relevant state behind one provider interface.
5. **Git/GitHub spike** — validate local Git + existing `gh` authentication before designing a full GitHub App flow.
6. **Context-switch benchmark** — run the same real development tasks in the current workflow and in Pane, then count external app/window switches.

## 14. Current definition of success

Pane v0 is successful if a developer can perform a meaningful local development loop while remaining inside one persistent project workspace, and that workflow feels materially better than assembling the same loop across VS Code, Terminal, a separate browser and Git/runtime tools.

The product thesis is validated by reduced context switching and retained state — not by the number of integrations shipped.

---

### Research basis

This definition is derived from the Pane product discussion and the August 23, 2026 deep research report stored under `docs/research/`, which analyzed Veflow as a near-match together with Canopy, Tempest, Superset and relevant editor/runtime foundations.
