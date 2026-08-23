import test from 'node:test';
import assert from 'node:assert/strict';
import { createFileTree, insertDirectoryChildren, toggleDirectory } from './fileTree.ts';

test('inserting children updates only the targeted directory', () => {
  const tree = createFileTree([
    { name: 'src', relativePath: 'src', kind: 'directory' },
    { name: 'docs', relativePath: 'docs', kind: 'directory' },
  ]);

  const next = insertDirectoryChildren(tree, 'src', [
    { name: 'main.ts', relativePath: 'src/main.ts', kind: 'file' },
  ]);

  assert.equal(next[0]?.relativePath, 'docs');
  assert.equal(next[1]?.relativePath, 'src');
  assert.deepEqual(next[1]?.children?.map((node) => node.relativePath), ['src/main.ts']);
  assert.equal(next[0]?.children, undefined);
});

test('sorts directories before files and names case-insensitively', () => {
  const tree = createFileTree([
    { name: 'zeta.ts', relativePath: 'zeta.ts', kind: 'file' },
    { name: 'Beta', relativePath: 'Beta', kind: 'directory' },
    { name: 'alpha', relativePath: 'alpha', kind: 'directory' },
    { name: 'Alpha.ts', relativePath: 'Alpha.ts', kind: 'file' },
  ]);

  assert.deepEqual(tree.map((node) => node.name), ['alpha', 'Beta', 'Alpha.ts', 'zeta.ts']);
});

test('collapsing a directory preserves previously loaded children', () => {
  const loaded = insertDirectoryChildren(
    createFileTree([{ name: 'src', relativePath: 'src', kind: 'directory' }]),
    'src',
    [{ name: 'main.ts', relativePath: 'src/main.ts', kind: 'file' }],
  );

  const collapsed = toggleDirectory(loaded, 'src');

  assert.equal(collapsed[0]?.expanded, false);
  assert.deepEqual(collapsed[0]?.children?.map((node) => node.name), ['main.ts']);
});
