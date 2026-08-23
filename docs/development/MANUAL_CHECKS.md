# Pane Manual Checks

These checks cover behavior that a headless CI runner cannot prove. Run the relevant section after a feature changes native launch or visible product behavior.

## Baseline native launch

```sh
git switch dev
git pull --ff-only
npm install
npm run tauri:dev
```

Expected:
- Pane launches as a native macOS application.
- No Vite error overlay appears.
- No Rust/Tauri startup panic appears in the terminal.

## Workspace

1. Click **Open Folder**.
2. Select a real local repository.
3. Confirm the selected folder becomes the active workspace.
4. Confirm the workspace name and root path are correct.

## File explorer

1. Confirm root files and folders appear under **Files**.
2. Expand at least one nested directory.
3. Collapse and reopen it.
4. Open several UTF-8 text files.
5. Confirm paths and contents correspond to the selected files.

## Monaco editor

Open representative files such as `.ts`, `.tsx`, `.json`, `.css`, and `.md`.

Expected:
- language badge matches the file type;
- syntax highlighting is visible;
- editor accepts normal text input;
- editing shows the dirty indicator;
- **Save** persists the change;
- `Cmd+S` persists the change;
- reopening the file shows the saved content;
- unknown extensions safely fall back to plaintext.

## Current M0 checks to add as features land

The following sections become active when their implementation reaches `dev`:

- PTY terminal starts in the workspace root;
- `codex` runs interactively inside Pane;
- Git changes appear under **Changes** and open as diffs;
- `npm run dev` / `pnpm dev` listeners are discovered automatically;
- discovered servers appear under **Servers**;
- a server opens in the integrated browser with one click.

## Reporting a manual failure

Record:
- exact branch/commit;
- failing action;
- visible error;
- terminal output if relevant;
- screenshot when the failure is UI-specific.

Do not mark the feature accepted until the relevant manual flow works again.
