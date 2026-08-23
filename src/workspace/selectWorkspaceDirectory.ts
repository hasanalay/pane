import { open } from '@tauri-apps/plugin-dialog';

export async function selectWorkspaceDirectory(): Promise<string | null> {
  return open({
    directory: true,
    multiple: false,
    title: 'Open workspace',
  });
}
