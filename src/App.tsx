import { useState } from 'react';
import { FileExplorer } from './files/FileExplorer';
import { chooseWorkspace, type Workspace } from './workspace/workspace';
import { selectWorkspaceDirectory } from './workspace/selectWorkspaceDirectory';
import { readWorkspaceTextFile, setWorkspaceRoot } from './workspace/workspaceApi';

interface OpenFile {
  relativePath: string;
  content: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [opening, setOpening] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [openFile, setOpenFile] = useState<OpenFile | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const openWorkspace = async () => {
    if (opening) return;

    setOpening(true);
    setWorkspaceError(null);

    try {
      const nextWorkspace = await chooseWorkspace(selectWorkspaceDirectory);
      if (!nextWorkspace) return;

      await setWorkspaceRoot(nextWorkspace.rootPath);
      setWorkspace(nextWorkspace);
      setSelectedPath(null);
      setOpenFile(null);
      setFileError(null);
    } catch (error) {
      setWorkspaceError(errorMessage(error));
    } finally {
      setOpening(false);
    }
  };

  const openWorkspaceFile = async (relativePath: string) => {
    setSelectedPath(relativePath);
    setFileLoading(true);
    setFileError(null);
    setOpenFile(null);

    try {
      const content = await readWorkspaceTextFile(relativePath);
      setOpenFile({ relativePath, content });
    } catch (error) {
      setFileError(errorMessage(error));
    } finally {
      setFileLoading(false);
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
          {workspaceError ? <p className="inline-error">{workspaceError}</p> : null}
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
        <div className="topbar-actions">
          {workspaceError ? <span className="topbar-error">{workspaceError}</span> : null}
          <button className="secondary-button" type="button" onClick={openWorkspace} disabled={opening}>
            {opening ? 'Opening…' : 'Open Folder'}
          </button>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="sidebar">
          <section className="sidebar-section sidebar-files">
            <div className="section-title">Files</div>
            <FileExplorer
              workspaceRoot={workspace.rootPath}
              selectedPath={selectedPath}
              onFileSelect={(relativePath) => void openWorkspaceFile(relativePath)}
            />
          </section>
          <section className="sidebar-section sidebar-section-bottom">
            <div className="section-title">Changes</div>
            <div className="placeholder-row">Git changes will appear here</div>
          </section>
        </aside>

        <section className="content-area">
          <div className="main-surface">
            {fileLoading ? (
              <div className="workspace-ready">
                <p className="eyebrow">Opening file</p>
                <h2>{selectedPath}</h2>
              </div>
            ) : fileError ? (
              <div className="workspace-ready workspace-error-state">
                <p className="eyebrow">Unable to open file</p>
                <h2>{selectedPath}</h2>
                <p>{fileError}</p>
              </div>
            ) : openFile ? (
              <section className="file-viewer">
                <header className="file-viewer-header">
                  <span>{openFile.relativePath}</span>
                  <span className="file-viewer-mode">Read only</span>
                </header>
                <pre className="file-viewer-content"><code>{openFile.content}</code></pre>
              </section>
            ) : (
              <div className="workspace-ready">
                <p className="eyebrow">Workspace ready</p>
                <h2>{workspace.name}</h2>
                <code>{workspace.rootPath}</code>
                <p>
                  Browse the real workspace tree on the left and open a UTF-8 text file.
                  Editing arrives in the next M0 slice.
                </p>
              </div>
            )}
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
