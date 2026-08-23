#!/usr/bin/env bash
set -euo pipefail

VALIDATION_HOME="${PANE_VALIDATION_HOME:-$HOME/.pane-validation}"
FIXTURE="${PANE_FIXTURE_ROOT:-$VALIDATION_HOME/fixture}"

if [ -e "$FIXTURE" ]; then
  printf 'ERROR: fixture path already exists: %s\n' "$FIXTURE" >&2
  printf 'Remove it manually if you want a fresh validation fixture.\n' >&2
  exit 1
fi

mkdir -p "$FIXTURE"

cat > "$FIXTURE/package.json" <<'JSON'
{
  "name": "pane-canopy-validation-fixture",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node server.mjs"
  }
}
JSON

cat > "$FIXTURE/server.mjs" <<'JS'
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const host = '127.0.0.1';
const port = 4173;

const server = createServer(async (_req, res) => {
  try {
    const html = await readFile(join(here, 'index.html'), 'utf8');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(String(error));
  }
});

server.listen(port, host, () => {
  console.log(`Pane validation fixture: http://${host}:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
JS

cat > "$FIXTURE/index.html" <<'HTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pane Validation Fixture</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 4rem; }
      main { max-width: 720px; margin: 0 auto; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    </style>
  </head>
  <body>
    <main>
      <h1>Pane × Canopy validation</h1>
      <p>Edit this sentence, save the file, then refresh the embedded Preview.</p>
      <p>Expected endpoint: <code>http://127.0.0.1:4173</code></p>
    </main>
  </body>
</html>
HTML

cat > "$FIXTURE/.gitignore" <<'EOF'
.DS_Store
node_modules/
EOF

git -C "$FIXTURE" init -q
git -C "$FIXTURE" add package.json server.mjs index.html .gitignore
git -C "$FIXTURE" -c user.name="Pane Validation" -c user.email="validation@pane.local" commit -q -m "chore: create validation fixture"

printf 'Fixture ready: %s\n' "$FIXTURE"
printf 'Git HEAD: %s\n' "$(git -C "$FIXTURE" rev-parse --short HEAD)"
printf 'Git status: %s\n' "$(git -C "$FIXTURE" status --porcelain | wc -l | tr -d ' ') change(s)"
printf '\nSmoke test manually with:\n'
printf '  cd %q\n' "$FIXTURE"
printf '  npm run dev\n'
printf '\nExpected URL: http://127.0.0.1:4173\n'
