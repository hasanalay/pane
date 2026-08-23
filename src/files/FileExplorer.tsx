import { useEffect, useState } from 'react';
import { listWorkspaceDirectory } from '../workspace/workspaceApi';
import {
  createFileTree,
  insertDirectoryChildren,
  setDirectoryError,
  setDirectoryLoading,
  toggleDirectory,
  type FileTreeNode,
} from './fileTree';

interface FileExplorerProps {
  workspaceRoot: string;
  selectedPath: string | null;
  onFileSelect: (relativePath: string) => void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

interface FileTreeRowsProps {
  nodes: FileTreeNode[];
  depth: number;
  selectedPath: string | null;
  onNodeSelect: (node: FileTreeNode) => void;
}

function FileTreeRows({ nodes, depth, selectedPath, onNodeSelect }: FileTreeRowsProps) {
  return (
    <>
      {nodes.map((node) => (
        <div key={node.relativePath}>
          <button
            className={`file-tree-row${selectedPath === node.relativePath ? ' file-tree-row-selected' : ''}`}
            style={{ paddingLeft: 8 + depth * 14 }}
            type="button"
            onClick={() => onNodeSelect(node)}
            title={node.relativePath}
          >
            <span className="tree-chevron" aria-hidden="true">
              {node.kind === 'directory' ? (node.expanded ? '▾' : '▸') : ''}
            </span>
            <span className={`tree-kind tree-kind-${node.kind}`} aria-hidden="true" />
            <span className="tree-name">{node.name}</span>
            {node.loading ? <span className="tree-state">…</span> : null}
          </button>

          {node.error ? (
            <div className="tree-error" style={{ paddingLeft: 30 + depth * 14 }}>
              {node.error}
            </div>
          ) : null}

          {node.kind === 'directory' && node.expanded && node.children ? (
            <FileTreeRows
              nodes={node.children}
              depth={depth + 1}
              selectedPath={selectedPath}
              onNodeSelect={onNodeSelect}
            />
          ) : null}
        </div>
      ))}
    </>
  );
}

export function FileExplorer({ workspaceRoot, selectedPath, onFileSelect }: FileExplorerProps) {
  const [nodes, setNodes] = useState<FileTreeNode[]>([]);
  const [loadingRoot, setLoadingRoot] = useState(true);
  const [rootError, setRootError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setNodes([]);
    setLoadingRoot(true);
    setRootError(null);

    void listWorkspaceDirectory()
      .then((entries) => {
        if (!active) return;
        setNodes(createFileTree(entries));
      })
      .catch((error: unknown) => {
        if (!active) return;
        setRootError(errorMessage(error));
      })
      .finally(() => {
        if (active) setLoadingRoot(false);
      });

    return () => {
      active = false;
    };
  }, [workspaceRoot]);

  const handleNodeSelect = async (node: FileTreeNode) => {
    if (node.kind === 'file') {
      onFileSelect(node.relativePath);
      return;
    }

    if (node.children) {
      setNodes((current) => toggleDirectory(current, node.relativePath));
      return;
    }

    setNodes((current) => setDirectoryLoading(current, node.relativePath, true));

    try {
      const entries = await listWorkspaceDirectory(node.relativePath);
      setNodes((current) => insertDirectoryChildren(current, node.relativePath, entries));
    } catch (error) {
      setNodes((current) => setDirectoryError(current, node.relativePath, errorMessage(error)));
    }
  };

  if (loadingRoot) {
    return <div className="file-tree-message">Loading files…</div>;
  }

  if (rootError) {
    return <div className="file-tree-message file-tree-message-error">{rootError}</div>;
  }

  if (nodes.length === 0) {
    return <div className="file-tree-message">Workspace is empty.</div>;
  }

  return (
    <div className="file-tree" role="tree" aria-label="Workspace files">
      <FileTreeRows
        nodes={nodes}
        depth={0}
        selectedPath={selectedPath}
        onNodeSelect={(node) => void handleNodeSelect(node)}
      />
    </div>
  );
}
