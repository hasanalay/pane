import { useState } from 'react';
import { chooseWorkspace, type Workspace } from './workspace/workspace';
import { selectWorkspaceDirectory } from './workspace/selectWorkspaceDirectory';

export function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [opening, setOpening] = useState(false);

  const openWorkspace = async () => {
    if (opening) return;

    setOpening(true);
    try {
      const nextWorkspace = await chooseWorkspace(selectWorkspaceDirectory);
      if (nextWorkspace) setWorkspace(nextWorkspace);
    } finally {
      setOpening(false);
    }
  };

  if (!workspace) {
    return (
      <main className="welcome-shell">
        <section className="welcome-card">
          <div className="brand-mark">P</div>
          <p className="eyebrow">Pane · M0</p>
          <h1>Your local agent workspace.</h1>
          <p className="welcome-copy">
            Pick a project folder. Pane will keep the code, agent loop, changes,
            local servers and preview in one workspace as M0 grows.
          </p>
          <button className="primary-button" type="button" onClick={openWorkspace} disabled={opening}>
            {opening ? 'Opening…' : 'Open Folder'}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-row">
          <span className="brand-mark brand-mark-small">P</span>
          <strong>Pane</strong>
          <span className="workspace-separator">/</span>
          <span className="workspace-name">{workspace.name}</span>
        </div>
        <button className="secondary-button" type="button" onClick={openWorkspace} disabled={opening}>
          {opening ? 'Opening…' : 'Open Folder'}
        </button>
      </header>

      <div className="workspace-grid">
        <aside className="sidebar">
          <section className="sidebar-section">
            <div className="section-title">Files</div>
            <div className="placeholder-row">File explorer lands in M0 Task 2</div>
          </section>
          <section className="sidebar-section sidebar-section-bottom">
            <div className="section-title">Changes</div>
            <div className="placeholder-row">Git changes will appear here</div>
          </section>
        </aside>

        <section className="content-area">
          <div className="workspace-ready">
            <p className="eyebrow">Workspace ready</p>
            <h2>{workspace.name}</h2>
            <code>{workspace.rootPath}</code>
            <p>
              The native folder boundary is established. Files, editor, Codex,
              diffs, servers and the integrated browser will build on this root.
            </p>
          </div>
          <div className="terminal-placeholder">
            <span>Terminal</span>
            <small>PTY implementation is intentionally next, not mocked here.</small>
          </div>
        </section>
      </div>
    </main>
  );
}
