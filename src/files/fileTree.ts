import type { WorkspaceEntry } from '../workspace/workspaceApi';

export interface FileTreeNode extends WorkspaceEntry {
  children?: FileTreeNode[];
  expanded?: boolean;
  loading?: boolean;
  error?: string;
}

function compareEntries(a: WorkspaceEntry, b: WorkspaceEntry): number {
  if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

export function createFileTree(entries: WorkspaceEntry[]): FileTreeNode[] {
  return [...entries].sort(compareEntries).map((entry) => ({ ...entry }));
}

function updateNode(
  nodes: FileTreeNode[],
  relativePath: string,
  update: (node: FileTreeNode) => FileTreeNode,
): FileTreeNode[] {
  return nodes.map((node) => {
    if (node.relativePath === relativePath) return update(node);
    if (!node.children) return node;

    return {
      ...node,
      children: updateNode(node.children, relativePath, update),
    };
  });
}

export function insertDirectoryChildren(
  nodes: FileTreeNode[],
  relativePath: string,
  entries: WorkspaceEntry[],
): FileTreeNode[] {
  return updateNode(nodes, relativePath, (node) => ({
    ...node,
    children: createFileTree(entries),
    expanded: true,
    loading: false,
    error: undefined,
  }));
}

export function toggleDirectory(nodes: FileTreeNode[], relativePath: string): FileTreeNode[] {
  return updateNode(nodes, relativePath, (node) => ({
    ...node,
    expanded: !node.expanded,
  }));
}

export function setDirectoryLoading(
  nodes: FileTreeNode[],
  relativePath: string,
  loading: boolean,
): FileTreeNode[] {
  return updateNode(nodes, relativePath, (node) => ({
    ...node,
    loading,
    error: loading ? undefined : node.error,
  }));
}

export function setDirectoryError(
  nodes: FileTreeNode[],
  relativePath: string,
  error: string,
): FileTreeNode[] {
  return updateNode(nodes, relativePath, (node) => ({
    ...node,
    loading: false,
    error,
  }));
}
