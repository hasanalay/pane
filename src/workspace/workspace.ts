export interface Workspace {
  rootPath: string;
  name: string;
}

export type DirectorySelector = () => Promise<string | null>;

export async function chooseWorkspace(
  selectDirectory: DirectorySelector,
): Promise<Workspace | null> {
  const selectedPath = await selectDirectory();
  if (!selectedPath) return null;

  const rootPath = selectedPath.replace(/[\\/]+$/, '');
  const segments = rootPath.split(/[\\/]/);
  const name = segments.at(-1) ?? rootPath;

  return { rootPath, name };
}
