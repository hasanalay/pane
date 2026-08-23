const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  jsonc: 'json',
  css: 'css',
  scss: 'scss',
  less: 'less',
  html: 'html',
  htm: 'html',
  md: 'markdown',
  markdown: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
  xml: 'xml',
  svg: 'xml',
  py: 'python',
  rs: 'rust',
  go: 'go',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  sql: 'sql',
};

export function languageForPath(relativePath: string): string {
  const fileName = relativePath.split(/[\\/]/).at(-1) ?? relativePath;
  const extensionIndex = fileName.lastIndexOf('.');

  if (extensionIndex <= 0 || extensionIndex === fileName.length - 1) {
    return 'plaintext';
  }

  const extension = fileName.slice(extensionIndex + 1).toLowerCase();
  return LANGUAGE_BY_EXTENSION[extension] ?? 'plaintext';
}
