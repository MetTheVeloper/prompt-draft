# Development Workflow — Time-First Local Verification

Status: **PROJECT-WIDE OPERATIONAL RULE**

Date: 2026-09-09

This document defines the default local-development and verification workflow for Prompt Draft. It is intentionally project-wide rather than milestone-specific.

## 1. Core rule: smallest rebuild scope

Developer time is a first-class constraint.

Before asking the founder to rebuild or restart anything, determine the smallest runtime scope that can actually contain the changed files. Do **not** default to rebuilding the full Docker stack.

Use this order of preference:

```text
no rebuild
-> one service rebuild
-> multiple required services
-> full stack only when genuinely required
```

A full `pnpm stack` is a fallback, not the default verification command.

## 2. Prefer package.json workflow commands

When a project script exists, instructions to the founder should use that script instead of spelling out raw Docker Compose commands.

Raw `docker compose ...` commands are appropriate only when:

- no project script exists for the required operation;
- a one-off database/query/debug command is required; or
- the raw command materially improves diagnosis.

This keeps the project vocabulary stable across chats and makes the workflow easier to learn and repeat.

## 3. Rebuild decision matrix

### Documentation-only changes

Examples:

```text
docs/**
README files
strategy ledgers
```

Default:

```text
no Docker rebuild
```

Run only the documentation/static checks that are actually relevant.

### Frontend-only changes

Examples:

```text
app/**
i18n/**
frontend-facing scripts/config that are baked into the Nuxt image
```

Default:

```powershell
pnpm frontend
```

Do not rebuild API, database, or translator merely because frontend code changed.

### API/backend-only changes

Examples:

```text
backend/src/**
backend/package.json
backend/data/** when copied into the API image
```

Default:

```powershell
pnpm api
```

Do not rebuild the frontend merely because API code changed.

### SQL migration changes

`backend/sql/**` is copied into the API image.

If a migration was added or edited **after the currently running API image was built**, first rebuild only API:

```powershell
pnpm api
```

Then apply schema:

```powershell
docker compose exec api npm run db:schema
```

If the running API image already contains the migration, do **not** rebuild again; run only `db:schema`.

### API test-file changes

Backend tests run inside the API container. If a new/changed test file is not yet present in the running API image, rebuild only API first with `pnpm api`.

If the image already contains the test, run only the requested test command.

### Frontend + API changes

When both runtime images genuinely changed, rebuilding both is justified. Prefer the smallest command that covers the changed services. Use full stack only when that is materially simpler or required by shared runtime changes.

### Compose/environment/runtime-topology changes

Changes to Compose files, service wiring, Dockerfiles shared by multiple services, or environment contracts may justify:

```powershell
pnpm stack
```

Use force recreate only when stale container state, changed environment, or container topology requires it.

## 4. Restart/recreate is not a substitute for reasoning

Do not recommend `*:restart` merely because something looks stale.

First determine whether source code is baked into an image. If code changed and the image must be rebuilt, a plain container restart cannot load that source. Conversely, if no image content changed, rebuilding is wasted time.

`--force-recreate` should be exceptional, not routine.

## 5. `git pull` rule

Do not tell the founder to run `git pull` reflexively.

Recommend it only when the authoritative remote branch contains commits that are not already present locally, or when the founder has not yet pulled the implementation being verified.

If the founder has just pulled the current authoritative head and no newer commit exists, omit `git pull`.

## 6. Local `pnpm build` vs Docker runtime

A successful host-side:

```powershell
pnpm build
```

verifies the Nuxt production build, but it does **not** update an already-running Docker frontend image.

Likewise, editing/pulling backend files on the host does not update a previously built API image because backend source/SQL/tests are copied into that image.

Verification instructions must distinguish build validation from runtime-image refresh.

## 7. Verification commands should be incremental

After a change, run the narrowest relevant regression first. Broader regression suites belong at slice/phase acceptance gates, not after every tiny UI edit.

Example progression:

```text
specific component/API test
-> related slice regression
-> production build if frontend changed
-> aggregate phase regression only at acceptance checkpoint
```

Do not repeatedly make the founder pay the cost of unrelated tests.

## 8. Current service shortcuts

Root `package.json` is the command reference. Intended service-scoped commands include:

```powershell
pnpm frontend
pnpm frontend:restart
pnpm frontend:status
pnpm frontend:logs

pnpm api
pnpm api:restart
pnpm api:status
pnpm api:logs

pnpm stack
pnpm stack:restart
pnpm stack:status
pnpm stack:logs
```

`frontend` and `api` are the normal rebuild commands for service-local source changes. `stack` is reserved for changes that genuinely cross service boundaries or require the complete stack to be rebuilt.

## 9. Assistant operating requirement

For every future implementation/verification instruction, including in a new chat:

1. inspect which files/services changed;
2. decide whether any rebuild is required at all;
3. select the smallest service scope;
4. prefer the root package script for that scope;
5. explain broader rebuilds only when they are truly necessary;
6. never default to `pnpm stack` for convenience.

This rule remains active unless the founder explicitly overrides it for a specific verification run.
