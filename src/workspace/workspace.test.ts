import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseWorkspace } from './workspace.ts';

test('returns a workspace for the selected directory', async () => {
  const workspace = await chooseWorkspace(async () => '/Users/dev/example-project');

  assert.deepEqual(workspace, {
    rootPath: '/Users/dev/example-project',
    name: 'example-project',
  });
});

test('returns null when directory selection is cancelled', async () => {
  const workspace = await chooseWorkspace(async () => null);
  assert.equal(workspace, null);
});

test('derives the workspace name when the selected path has trailing separators', async () => {
  const workspace = await chooseWorkspace(async () => '/Users/dev/example-project///');

  assert.deepEqual(workspace, {
    rootPath: '/Users/dev/example-project',
    name: 'example-project',
  });
});
