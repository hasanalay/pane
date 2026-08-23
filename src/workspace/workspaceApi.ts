import { invoke } from '@tauri-apps/api/core';

export interface WorkspaceEntry {
  name: string;
  relativePath: string;
  kind: 'file' | 'directory';
}

export async function setWorkspaceRoot(rootPath: string): Promise<void> {
  await invoke('set_workspace_root', { rootPath });
}

export async function listWorkspaceDirectory(relativePath = ''): Promise<WorkspaceEntry[]> {
  return invoke<WorkspaceEntry[]>('list_workspace_directory', { relativePath });
}

export async function readWorkspaceTextFile(relativePath: string): Promise<string> {
  return invoke<string>('read_workspace_text_file', { relativePath });
}
