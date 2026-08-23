import test from 'node:test';
import assert from 'node:assert/strict';

async function loadLanguageForPath() {
  try {
    const module = await import('./language.ts');
    return module.languageForPath;
  } catch {
    return undefined;
  }
}

test('detects web project languages from file paths', async () => {
  const languageForPath = await loadLanguageForPath();
  assert.equal(typeof languageForPath, 'function');
  if (!languageForPath) return;

  assert.equal(languageForPath('src/App.tsx'), 'typescript');
  assert.equal(languageForPath('src/index.ts'), 'typescript');
  assert.equal(languageForPath('src/App.jsx'), 'javascript');
  assert.equal(languageForPath('vite.config.js'), 'javascript');
  assert.equal(languageForPath('package.json'), 'json');
  assert.equal(languageForPath('src/styles.css'), 'css');
  assert.equal(languageForPath('src/theme.scss'), 'scss');
  assert.equal(languageForPath('index.html'), 'html');
});

test('detects common backend and documentation languages', async () => {
  const languageForPath = await loadLanguageForPath();
  assert.equal(typeof languageForPath, 'function');
  if (!languageForPath) return;

  assert.equal(languageForPath('README.md'), 'markdown');
  assert.equal(languageForPath('.github/workflows/ci.yml'), 'yaml');
  assert.equal(languageForPath('server/main.py'), 'python');
  assert.equal(languageForPath('src-tauri/src/lib.rs'), 'rust');
  assert.equal(languageForPath('cmd/server/main.go'), 'go');
  assert.equal(languageForPath('scripts/setup.sh'), 'shell');
});

test('falls back to plaintext for unknown file types', async () => {
  const languageForPath = await loadLanguageForPath();
  assert.equal(typeof languageForPath, 'function');
  if (!languageForPath) return;

  assert.equal(languageForPath('notes.custom-format'), 'plaintext');
  assert.equal(languageForPath('LICENSE'), 'plaintext');
});
