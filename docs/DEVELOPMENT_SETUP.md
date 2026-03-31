# Backend Development Setup

## Quick Start

1. Install and bootstrap:
```bash
npm run setup
```
2. Start development server:
```bash
npm run dev
```

`npm run setup` does:
- `npm install --no-audit --no-fund`
- `npm run prepare` (installs Husky hooks)
- Creates `.env.dev` from `.env.example` if missing

## Lockfile Policy

- `package-lock.json` must stay committed and in sync with `package.json`.
- If dependencies change, include the updated lockfile in the same PR.
- CI and deployment use `npm ci` for deterministic installs.

## Git Hooks

### `pre-commit`
- Runs `lint-staged`
- Auto-fixes staged JS/TS files with ESLint and Prettier

### `commit-msg`
- Validates commit message format
- Allowed types: `feat`, `style`, `fix`, `refactor`, `chore`
- Example: `feat(auth): add refresh token rotation`

### `pre-push`
- Validates branch naming
- Runs:
```bash
npm run lint
npm run typecheck
```

### `post-checkout`
- Runs after branch switch/checkouts
- Installs dependencies only when `package.json` or `package-lock.json` changed between refs

## Branch Naming Rules

Allowed long-lived branches:
- `master`
- `development`
- `develop`

Allowed branch prefixes:
- `feature/...`
- `bugfix/...`
- `hotfix/...`
- `release/...`

Examples:
- `feature/user-profile-api`
- `bugfix/login-token-refresh`
- `release/sprint-8`

## Changelog Policy

- All work must eventually be reflected in `docs/CHANGELOG.md`.
- Do not update changelog in feature/bugfix/hotfix PRs.
- Update changelog only when PR target branch is:
  - `release/sprint-*`
  - `master`
- CI enforces this automatically on pull requests.

## VS Code Setup

Workspace settings are in `.vscode/settings.json`.

Recommended extensions are in `.vscode/extensions.json`:
- ESLint
- Prettier
- EditorConfig
- DotENV

## CI Notes

- GitHub Actions uses:
  - `node-version-file: ".nvmrc"`
  - `cache: "npm"`
- CI logs print:
  - expected Node version from `.nvmrc`
  - active Node/npm versions
  - npm cache hit/miss status
- Workflow concurrency is enabled to cancel stale in-progress runs for the same ref.
- Server deploy resets hard to `origin/<branch>` before install/build, so local server changes cannot block future deploy pulls.
- After deploy, CI runs a smoke check against `http://127.0.0.1:3000/health` on the server.

## PR Governance

- CODEOWNERS file: `.github/CODEOWNERS`
- PR template: `.github/pull_request_template.md`
- Keep these files updated whenever team ownership or review process changes.

## Useful Commands

```bash
npm run setup
npm run dev
npm run lint
npm run lint:fix
npm run typecheck
npm run compile
```
