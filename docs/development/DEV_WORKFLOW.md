# Pane Development Workflow

**Status:** Active
**Branch:** `dev`

## Branch policy

Pane development happens directly on `dev`.

- New implementation work is committed directly to `dev`.
- `main` is not used for day-to-day development.
- `main` is updated only when explicitly requested as a stable/release sync point.
- Feature branches and PRs are not part of the normal development loop unless explicitly requested for an exceptional change.

## Automated gate

Every push to `dev` runs `.github/workflows/dev-ci.yml` on a macOS runner.

The gate intentionally stays small and mirrors the repeatable terminal checks used during development:

```sh
npm install
npm test
npm run typecheck
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

A development step is not considered safe to continue from until the latest `Dev CI` run for `dev` is successful.

If CI fails:

1. inspect the failed step and logs;
2. fix the actual failure on `dev`;
3. push the fix;
4. wait for the new `Dev CI` run;
5. continue only after it is green.

## Why `tauri:dev` is manual

`npm run tauri:dev` launches a long-running interactive desktop application, so it is not a suitable CI command. Native launch and product-behavior validation are tracked in `MANUAL_CHECKS.md` instead.

## Dependency lockfiles

`package-lock.json` and `src-tauri/Cargo.lock` are repository files and should be committed when dependency resolution changes them. Generated output such as `dist/`, `src-tauri/target/`, and `src-tauri/gen/` stays untracked.
