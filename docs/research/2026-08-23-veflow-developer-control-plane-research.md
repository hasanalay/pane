# Veflow as a Near-Match for an Open-Source Developer Control Plane / Developer Cockpit

**Research date:** 2026-08-23  
**Project:** Pane  
**Stage:** Product discovery / architecture research

## Executive summary

The requirement is sharper than “an AI IDE.”

Pane is being defined as a **local-first Developer Control Plane** whose primary design goal is to eliminate development context switching.

A representative acceptance scenario is:

> Codex CLI is working in one pane; a local development server or build is running in another; its port is automatically detected and rendered in an embedded browser; another terminal remains available for ad-hoc commands; the file tree and editor are still visible; Git changes can be reviewed, staged, committed, pushed, and turned into a PR without leaving the application.

That changes the competitive frame from:

```text
Editor + AI
```

to:

```text
Workspace
├── Files / Editor
├── AI agents / Chat
├── Terminals
├── Processes / Dev servers
├── Browser / Preview
├── Git / GitHub
├── Docker / Compose / Containers
└── Environment state
```

all sharing the same project context and state.

### Bottom-line assessment

**Veflow is a strong product reference, but a poor direct open-source foundation.**

Its desktop experience already combines local repositories, a full code-server-based editor, multi-tab terminals, local AI-agent CLIs, worktrees, Git/GitHub workflows, task context and cloud previews. Veflow explicitly describes Desktop Dev mode as a “full dev cockpit,” and its documentation confirms that local agents execute in real PTYs against real local checkouts while the editor operates on the same files.

Three gaps are decisive for Pane:

1. **No documented first-class local runtime control plane.** Veflow does not publicly expose a Docker/Compose/container dashboard, generic process inventory, container health/state model, image/volume/network management or equivalent machine/runtime model.
2. **The local preview story does not clearly match Pane's core workflow.** Public Veflow preview documentation is focused on cloud/PR previews rather than “my dev server is running on localhost:3000; show it beside Codex and my shell.”
3. **Veflow is proprietary.** No public first-party Veflow application source repository, general SDK or forkable open-source codebase was identified.

Therefore Pane should not be built as “open-source Veflow.” It should be an independent developer-control-plane architecture that uses Veflow as one of several product references.

After comparing open-source alternatives, **Canopy** is currently the most interesting technical starting point and **Tempest** is an especially useful UX reference.

The working boundary is:

> **Canopy/Tempest-style local workspace UX + Veflow-style agent/worktree orchestration + Docker/OrbStack-style runtime visibility.**

The key architectural decision is to make the **workspace** — not the editor and not the AI chat — the top-level object.

---

## 1. Veflow teardown

### 1.1 What Veflow gets right

Veflow's public product surface is unusually close to the original Pane concept.

Its Desktop Dev mode combines:

- local Git repositories
- local agent CLIs
- PTY-backed agent sessions
- multiple terminals
- a full VS Code-like editor experience powered by code-server
- worktrees for isolated parallel tasks
- environment bootstrap around worktrees
- GitHub repositories and PR flow
- project/task context
- cloud preview deployments

The most important architectural precedent is the agent model.

Veflow does not require every coding agent to expose a bespoke SDK. Local tools can be discovered on `PATH` and executed in PTYs against the real checkout. Public examples include Claude Code, Codex, OpenCode, Gemini and other CLI coding agents.

This suggests a useful Pane principle:

> **The lowest-common-denominator agent integration can be process + PTY + filesystem + structured lifecycle metadata.**

That keeps the workspace stable while agents remain replaceable.

### 1.2 Worktrees are a first-class isolation primitive

Veflow also demonstrates that “create a worktree” is not enough.

Its worktree flow can account for development-environment setup such as:

- `.env` files
- dependency linking
- submodules
- Git hooks
- repository-specific setup commands

Repository-controlled setup commands use a trust-on-first-use mechanism: the exact commands are shown to the user and approval can be remembered per repository until the configuration changes.

The deeper product lesson is:

```text
Workspace
= branch/worktree
+ environment bootstrap
+ agent session
+ terminal
+ editor
+ task metadata
```

Pane's target extends that concept further:

```text
Workspace
= Veflow-like state
+ processes
+ ports
+ local previews
+ Git controls
+ Docker/Compose
+ container state
+ logs/health
+ persisted pane layout
```

### 1.3 Local-first is meaningful, but not identical to cloudless

Veflow's public privacy/security material says that local-mode source code and terminal activity stay outside the Veflow cloud data path, while account/session metadata may still exist in the service.

A separate nuance matters for Pane's own messaging: if a user runs Codex or Claude Code locally, the agent may still send code/context to its own model provider. “Pane does not proxy local source code” and “no source ever leaves the machine” are different claims.

Pane should be precise about this distinction.

### 1.4 What Veflow does not publicly expose

Public materials do not establish:

- the desktop shell framework used around the embedded editor
- a public desktop IPC schema
- a general local control daemon API
- a public plugin ABI
- a broad developer SDK
- a generic control CLI
- a first-class Docker/Compose runtime layer

Those details should not be inferred as facts.

---

## 2. Fit against Pane's single-workspace requirement

The critical question is not whether a capability exists somewhere in a product.

The question is:

> **Can the developer retain the state of concurrent development activities and manipulate them without switching applications or reconstructing context?**

A tool gets less credit if it can run a dev server but requires another browser, or if it “supports Git” only by pushing the developer into another application.

### Strong Veflow fit

Veflow is strong in:

- native desktop experience
- local filesystem / real project checkout
- full embedded editor
- multiple terminals
- Codex / Claude / OpenCode-style local agents
- parallel agent sessions
- worktree isolation
- environment-aware worktree bootstrap
- GitHub repositories and PR workflow
- PR review
- local-source privacy boundary

### Partial or unclear fit

Public documentation is less clear for:

- cockpit-level stage/commit/push as a dedicated product surface rather than relying on the embedded editor/Git workflow
- generic managed local process inventory
- automatic port discovery as a first-class workspace capability
- local service health/lifecycle
- browser + terminal + agent + runtime as one explicit composition

### Major gaps for Pane's target

No first-class public Veflow model was identified for:

- Docker container inventory
- start/stop/restart container controls
- container logs
- health/resources
- Compose project/service topology
- images/volumes/networks
- runtime-provider abstraction
- OrbStack/Podman state
- DevPod/devcontainer control
- embedded localhost browser as a central local workflow

This is the strongest product opening identified by the research.

---

## 3. The browser example exposes the product difference

Pane's intended screen is conceptually closer to:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Project: my-app   main   ● 7 changes   ↑ 1 commit   localhost:3000        │
├────────────┬─────────────────────────────┬───────────────────────────────────┤
│ FILES/GIT  │ EDITOR                      │ AGENT                            │
│            │                             │ Codex                            │
│ src/       │ app/page.tsx                │ ● working                        │
│ api/       │                             │ "Implementing checkout..."      │
│ ...        │                             │                                  │
├────────────┴─────────────────────────────┼───────────────────────────────────┤
│ TERMINAL 1                               │ PREVIEW                          │
│ $ npm run dev                            │                                  │
│ Ready on http://localhost:3000           │ [ actual localhost application ] │
├──────────────────────────────────────────┴───────────────────────────────────┤
│ RUN: web ● :3000   postgres ●   redis ●   Docker: healthy                  │
│ Git: 7 changed   [Review] [Stage] [Commit] [Push] [Create PR]             │
└─────────────────────────────────────────────────────────────────────────────┘
```

This is meaningfully different from an IDE with separate buttons for “terminal,” “AI” and “preview.”

Pane is supposed to manage **simultaneous activity**.

A useful top-level state model is:

```text
Workspace
├── What am I editing?
├── What are my agents doing?
├── What commands are running?
├── What services are alive?
├── Where can I see the application?
├── What changed?
├── What can I ship?
└── Is my development environment healthy?
```

This leads to a better product metric than a feature checklist:

> **How often does a developer have to leave the workspace to complete the normal edit → run → observe → debug → agent → inspect → commit → push loop?**

The desired answer should approach zero.

---

## 4. Open-source competitive landscape

### 4.1 Canopy — strongest open-source architecture reference

Canopy is the most relevant open-source codebase identified in the research.

Public material indicates an MIT-licensed local-first desktop application using Tauri with a Rust system-facing backend and a React workspace UI.

Relevant capabilities include:

- local agent CLIs
- PTYs
- terminals
- file access/watchers
- Monaco-based editing
- Git/PR state
- local services/processes
- detected/openable URLs
- preview surfaces
- process/resource information
- worktree handling
- no required account / no required telemetry in the documented product

The architecture matters more than the feature checklist: PTYs, language servers, file watchers and local processes are owned by the native backend instead of being hidden inside an editor extension.

That is very close to the recommended Pane control-plane boundary.

The missing leap is:

```text
Canopy today
services + processes + ports

        ↓

Pane target
services + processes + ports
+ Docker/Compose objects
+ containers
+ health
+ logs
+ runtime events
+ dev environments
```

This is why a Canopy source spike should happen before Pane commits to building everything from scratch.

### 4.2 Tempest — strongest focused UX reference

Tempest is MIT-licensed and smaller/earlier, but its interaction model maps directly to Pane's core scenario.

It combines:

- Claude / Codex / Pi agent workflows
- terminal
- Monaco/LSP editor
- browser
- Git/Jujutsu
- persistent task workspaces

Most importantly, its public materials describe terminal URLs opening inside the workspace browser pane beside the shell.

Pane should likely support an interaction such as:

```text
$ npm run dev
> http://localhost:3000

● Web service discovered · localhost:3000   [Open Preview]
```

The important design step is that the URL becomes a **workspace service object**, not just a clickable string.

### 4.3 Superset — strong orchestration/control reference

Superset is particularly interesting because its product model is not confined to a GUI.

It exposes control through desktop/CLI/SDK/MCP-oriented surfaces while supporting:

- CLI coding agents
- worktrees
- persistent terminals
- diff/commit/push
- embedded browser
- port/dev-server discovery

That reinforces a Pane architecture of:

```text
one control core
    │
    ├── Desktop
    ├── CLI
    └── MCP
```

rather than a desktop application plus unrelated helper commands.

Its Elastic License 2.0 status makes it a weaker candidate for the foundation of a genuinely open-source core, but it remains a valuable implementation/product reference.

### 4.4 Veflow — strongest commercial reference

Veflow remains especially useful for:

- worktrees as normal UX
- environment-aware workspace creation
- generic CLI-agent integration
- editor as part of the workspace rather than the entire product
- GitHub/PR-oriented agent flow

It is a benchmark, not a fork target.

---

## 5. Runtime and infrastructure layer

Pane's clearest differentiation opportunity is the missing runtime layer.

### 5.1 Runtime should be a provider abstraction

Docker-compatible runtimes expose APIs for containers, images, networks, volumes, logs and events. Compose also exposes a programmatic application/service model.

Pane should avoid spreading raw `docker` command assumptions through the UI.

A conceptual provider boundary is:

```text
RuntimeProvider
├── detect()
├── projects()
├── containers()
├── events()
├── start(id)
├── stop(id)
├── restart(id)
├── logs(id)
└── stats(id)
```

with implementations/providers such as:

- Docker
- Podman
- DevPod integration
- runtime-specific extensions where useful

### 5.2 OrbStack

OrbStack intentionally supports the Docker ecosystem, so a first implementation should be able to treat Docker Desktop and OrbStack through the same Docker-compatible provider for common operations.

OrbStack-specific functionality can be added later through its own CLI/API surface where necessary.

### 5.3 Podman

Podman exposes Docker-compatible and native APIs. The first Pane provider can target the common Docker-compatible subset, then add Podman-native capabilities later.

On macOS the implementation must account for Podman's VM/remote-service model.

### 5.4 DevPod

DevPod is a different abstraction: it manages development environments around `devcontainer.json` and local/remote/cloud providers.

Pane should initially integrate it rather than reimplement its provisioning layer.

A future Pane workspace could expose environment state such as:

```text
Environment
──────────────────────────────
Local ● current
Docker available
OrbStack running
DevPod workspace: api-dev
SSH not connected
```

---

## 6. Git and GitHub direction

### Local Git

The lowest-risk initial path is to reuse the installed `git` CLI because that preserves the developer's existing:

- SSH configuration
- credential helpers
- signing configuration
- hooks
- Git attributes
- global/local config
- worktree behavior

Pane should expose a product-native flow around Git rather than merely embedding a shell:

```text
7 changed
    ↓
Review diff
    ↓
Stage selected
    ↓
Commit
    ↓
Push
    ↓
Create PR
    ↓
CI / PR status remains visible
```

### GitHub

An early implementation can reuse existing `gh` authentication where appropriate. A more productized integration can later move to a GitHub App with least-privilege permissions.

---

## 7. Editor strategy

The biggest strategic mistake would be trying to build a complete VS Code replacement before Pane proves its control-plane value.

### Monaco

Advantages:

- MIT licensed
- lightweight compared with carrying the full VS Code application
- strong editing component for a custom workspace UX
- leaves Pane free to make the workspace the product center

Limitation:

- Monaco is not VS Code; it does not provide the complete VS Code extension-host/application architecture.

### code-server / OpenVSCode Server

Advantages:

- full VS Code/Code-OSS-style browser environment
- proves that embedded full-editor mode is viable

Costs:

- additional lifecycle/embedding complexity
- much larger product surface
- risk that Pane becomes subordinate to the embedded IDE

### Working recommendation

For validation:

```text
Monaco + LSP
+ integrated diff
+ integrated terminal
+ Open in VS Code / Zed
```

Then run a deliberate bake-off against an embedded code-server/OpenVSCode mode before making the final architecture decision.

---

## 8. Headless local control core

Pane should avoid placing privileged system control directly inside React components or editor extensions.

The recommended conceptual architecture is:

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
└── Adapters
    ├── Filesystem
    ├── Git
    ├── GitHub
    ├── PTY / Agent
    ├── Process
    ├── Browser / Preview
    ├── Docker / Runtime
    └── Editor
```

The architectural value is **one stateful local API behind every interface**.

Conceptually, the desktop and a future CLI should invoke the same control-plane operations.

An MCP surface can expose selected safe operations to agents without granting agents unrestricted access to the privileged runtime API.

---

## 9. State authority model

Pane should not create one giant database that pretends to own state already owned by development tools.

A local-first authority model should follow the real sources of truth:

| State | Source of truth |
| --- | --- |
| Source files | Filesystem |
| Branches / commits / worktrees | Git |
| Remote PR/issues/repository metadata | GitHub |
| Running shell commands | Local process / PTY supervisor |
| Local dev-server health | Process supervisor + probes |
| Ports | OS/process discovery + configured run tasks |
| Containers | Docker/Podman runtime API |
| Compose services | Compose/runtime model |
| Browser session | Desktop application |
| UI layout/tabs | Local state store |
| Agent session metadata | Local state + adapter state |
| Secrets | macOS Keychain / existing credential stores |
| Optional team sync | Separate cloud service |

---

## 10. Security implications

Pane requires unusually deep access to the developer's machine.

The UI/WebView should never receive unrestricted direct access to:

- Docker sockets
- arbitrary shell execution
- filesystem primitives
- credential stores

The intended boundary is:

```text
React / WebView
      │
      │ typed allow-listed commands
      ▼
Native privileged broker
├── filesystem
├── git
├── PTY
├── process manager
├── runtime API
└── credentials
```

Routine UI actions should request semantic operations such as:

```text
container.restart(container_id)
```

rather than generic arbitrary shell commands.

Permission design should distinguish capabilities such as:

- read file
- modify file
- run command
- access network
- read Git state
- commit
- push
- start/stop service
- read container logs
- restart container
- delete container
- delete volume

Repository-controlled setup commands should use an explicit trust model.

Agents should receive a narrower permission surface than the desktop user's full control plane.

---

## 11. Open-source strategy

### Do not fork Veflow

No public Veflow application source tree was identified, and its product is proprietary.

The viable strategy is:

> Independent open-source implementation using standard protocols and independently designed APIs, with Veflow used only as a product/reference benchmark.

### Canopy is worth a real source spike

Three strategies are worth evaluating in order:

1. **Independent Pane architecture borrowing patterns from Canopy/Tempest** — best long-term control.
2. **Canopy fork/spike to validate fit** — best way to learn whether its internals can accelerate Pane.
3. **Tempest-based prototype path** — useful for focused UX validation, but smaller/earlier.

Superset remains a strong reference but has a less suitable source-available license for a clean open-source foundation.

### License direction

The research recommends considering **Apache-2.0** for the Pane core because it is permissive and includes an explicit patent grant. MIT remains a reasonable alternative if contributor simplicity is prioritized.

This is a recommendation, not yet a locked Pane decision.

---

## 12. Pane-oriented repository modularity

A sustainable long-term structure could separate product domains approximately as:

```text
/apps
  /desktop
  /cli
/core
  /workspace
  /events
  /permissions
  /state
/adapters
  /filesystem
  /git
  /github
  /pty
  /process
  /browser
/providers
  /docker
  /podman
  /orbstack
  /devpod
/agents
  /codex
  /claude
  /opencode
  /gemini
  /generic-cli
/editors
  /monaco
  /code-server
  /external-vscode
  /external-zed
/protocols
  /local-api
  /mcp
/sdk
  /typescript
```

The important rule is:

> **Agents, editors and container runtimes should be adapters/providers, not foundations of the application.**

---

## 13. Pane-oriented workspace UX

A page-based product architecture such as:

- Agents page
- Containers page
- Git page
- Terminal page

would only move context switching inside Pane.

The primary UI should instead support persistent composable panes:

```text
┌─────────┬───────────────────────┬───────────────────┐
│ Explorer│ Editor                │ Codex             │
│ + Git   │                       │                   │
│         ├───────────────────────┼───────────────────┤
│         │ Browser               │ Runtime           │
│         │ localhost:3000        │ API ● healthy     │
│         │                       │ DB  ● healthy     │
├─────────┴───────────────────────┴───────────────────┤
│ Terminal: dev | shell | tests | logs               │
└─────────────────────────────────────────────────────┘
```

Each surface should eventually support a consistent set of layout behaviors such as:

- tab
- split
- move
- pin
- maximize temporarily
- restore
- persist per workspace

“Single app” should not mean that every panel is permanently visible.

It should mean:

> **Every active development context remains mounted and recoverable without crossing an application boundary.**

---

## 14. Principal risks

### Building an IDE instead of a control plane

**Severity:** Very high.

Trying to match VS Code consumes the roadmap and makes the actual Pane innovation secondary.

Mitigation: lightweight editor first; editor remains an adapter.

### Overcrowded UI

**Severity:** Very high.

“Everything in one screen” can become worse than separate applications.

Mitigation: persistent tabs/splits, focus modes and attention-state design rather than permanent dashboards.

### PTY/process lifecycle reliability

**Severity:** High.

Orphaned servers and broken terminal restore behavior quickly destroy trust.

Mitigation: native process supervision, ownership/recovery semantics and strong lifecycle tests.

### Runtime privilege surface

**Severity:** High.

Docker/runtime control is substantially more privileged than read-only file viewing.

Mitigation: narrow native broker and typed permissions.

### Untrusted repository setup

**Severity:** High.

Opening a repository must not silently become arbitrary code execution.

Mitigation: explicit trust-on-first-use for setup commands.

### Agent permissions

**Severity:** High.

Agents may modify files and execute commands independently.

Mitigation: explicit scopes, visible activity and approval for destructive operations.

### Port collisions across parallel worktrees

**Severity:** High.

Parallel agents often need simultaneous dev servers.

Mitigation: workspace-aware port allocation/discovery and environment injection.

### Editor expectations

**Severity:** High.

Users may interpret an embedded Monaco editor as “full VS Code.”

Mitigation: clear boundary plus external/full-editor escape hatch.

### Premature cloud sync

**Severity:** Medium.

Auth, privacy and synchronization can distract from the local workspace thesis.

Mitigation: keep workspace state local while the primary loop is being validated.

---

## 15. Prioritized validation work

The next step is not more broad market research. It is a set of bounded technical/product experiments.

### 1. Veflow workflow benchmark

Run a real repository through:

```text
Codex session
→ independent dev-server terminal
→ local preview attempt
→ Git diff
→ commit/push
→ PR
```

Record every point where Veflow forces an external window/application.

### 2. Canopy source architecture spike

Build Canopy from source and implement a tiny experimental runtime panel that can at least:

- list local containers
- stream one container's logs

Goal: decide whether Canopy is genuinely fork-worthy or only a reference.

### 3. Single-window golden-path prototype

Prototype one project screen containing:

- Explorer
- Codex PTY
- independent shell
- managed `npm run dev`
- embedded browser
- Git changes

simultaneously.

Do not add Docker yet.

Goal: validate that the cockpit interaction is actually better than VS Code + Terminal + browser.

### 4. Editor architecture bake-off

Implement the same simple workspace twice:

- Monaco + LSP
- local embedded code-server/OpenVSCode

Measure:

- startup
- memory
- implementation complexity
- keyboard integration
- pane integration
- maintenance surface

### 5. Unified runtime-provider prototype

Detect Docker Desktop, OrbStack and Podman and normalize the common project-relevant state:

- ID/name
- state
- ports
- health
- logs
- start/stop/restart

### 6. Compose-as-workspace experiment

Detect a project's Compose configuration and expose services such as:

```text
web
api
db
redis
```

as workspace objects with status, ports, health, logs and lifecycle controls.

### 7. Git/GitHub credential and UX spike

Validate:

- local Git status/diff/stage/commit/push
- existing `gh` authentication
- minimal PR read/create flow

before designing a complete GitHub App architecture.

### 8. Context-switching benchmark

Choose several real development tasks and perform them in the current workflow and in the Pane prototype.

Measure:

- number of application/window switches
- time from agent change to running preview
- time from change to inspected diff
- time from change to pushed commit

The point is to convert the product thesis into measurable acceptance criteria.

---

## Final assessment

Veflow demonstrates that several major pieces of the concept already work commercially:

```text
local repository
+ local CLI agents
+ PTYs
+ worktrees
+ embedded full editor
+ GitHub workflow
+ shared task context
```

But its center of gravity remains closer to:

```text
Task
→ Agent
→ Code
→ PR
→ Cloud Preview
```

Pane's intended center of gravity is different:

```text
                 WORKSPACE
                    │
        ┌───────────┼───────────┐
        │           │           │
       CODE      ACTIVITY     RUNTIME
        │           │           │
      files       agents      processes
      editor      terminals    ports
      diff        tasks        browser
      git                      containers
                               compose
                               logs
                               health
```

The highest-confidence opportunity from the research is therefore **not another Veflow clone and not another AI editor**.

It is an open-source, local-first workspace control plane that treats the editor, agent, terminal, browser, Git state, local processes and container runtime as peers.

The architecture should be designed around a headless local workspace controller with replaceable agent, editor, Git, browser and runtime adapters.

That architecture is what can eventually support the core Pane promise:

> Codex can be working, the application can be running, the browser can be visible, another terminal can remain active, Docker/runtime state can be observable, and the resulting code can be committed and pushed — all while the developer remains inside one persistent project workspace.

---

## Primary references used in the research

- Veflow — https://veflow.ai/
- Veflow Desktop docs — https://veflow.ai/docs/desktop
- Veflow Worktrees — https://veflow.ai/docs/worktrees
- Veflow Agents — https://veflow.ai/docs/agents
- Veflow Live Previews — https://veflow.ai/docs/live-previews
- Veflow Concepts — https://veflow.ai/docs/concepts
- Veflow Security — https://veflow.ai/security
- Veflow Privacy — https://veflow.ai/privacy
- Veflow Terms — https://veflow.ai/terms
- Canopy — https://github.com/FluidWorksApp/canopy-ide
- Tempest — https://github.com/MattFlower/tempest
- Superset — https://github.com/superset-sh/superset
- Monaco Editor — https://github.com/microsoft/monaco-editor
- VS Code source — https://github.com/microsoft/vscode
- code-server — https://github.com/coder/code-server
- OpenVSCode Server — https://github.com/gitpod-io/openvscode-server
- Docker Engine API — https://docs.docker.com/reference/api/engine/
- Docker Compose SDK — https://docs.docker.com/compose/compose-sdk/
- OrbStack Docker compatibility — https://docs.orbstack.dev/docker/
- Podman API — https://docs.podman.io/en/latest/_static/api.html
- DevPod — https://devpod.sh/docs/what-is-devpod
- Git worktrees — https://git-scm.com/docs/git-worktree
- GitHub CLI API — https://cli.github.com/manual/gh_api
