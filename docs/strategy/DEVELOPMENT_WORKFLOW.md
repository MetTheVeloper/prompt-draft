# Development Workflow — Time-First Local Verification

Status: **PROJECT-WIDE OPERATIONAL RULE**

Date: 2026-09-12

This document defines the default local-development and verification workflow for Prompt Draft. It is intentionally project-wide rather than milestone-specific.

For UI implementation, this workflow has one mandatory companion source of truth:

```text
docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md
```

Any task that creates or changes UI must follow that document in addition to the rebuild/verification rules below.

## 1. Core rule: smallest rebuild scope

Developer time is a first-class constraint.

Before asking the founder to rebuild or restart anything, determine the smallest runtime scope that can actually contain the changed files. Do **not** default to rebuilding the full Docker stack.

Use this order of preference:

```text
no rebuild
-> environment-only service recreate when image content did not change
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

### Environment-only changes

If only runtime environment values changed and the already-built image contains the accepted source, rebuilding the image is wasted time. Recreate only the affected container so Compose reads the new `.env` values:

```powershell
pnpm api:recreate
pnpm frontend:recreate
```

Use only the service(s) whose runtime environment actually changed.

This rule is especially important for production cutover configuration such as browser API origin, public site URL, noindex state or API CORS when the verified image itself is unchanged.

### Compose/runtime-topology changes

Changes to Compose files, service wiring, Dockerfiles shared by multiple services, network topology or another image-affecting runtime contract may justify:

```powershell
pnpm stack
```

Do not use `pnpm stack` merely because an environment value changed. Use force recreate only when changed environment or container topology requires a new container instance.

## 4. Restart/recreate is not a substitute for reasoning

Do not recommend `*:restart` merely because something looks stale.

First determine whether source code is baked into an image. If code changed and the image must be rebuilt, a plain container restart/recreate cannot load that source. Conversely, if no image content changed, rebuilding is wasted time.

`--force-recreate` is appropriate for a confirmed runtime-environment change where the existing image is already the desired image. It should not be used as generic troubleshooting ritual.

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
pnpm frontend:recreate
pnpm frontend:restart
pnpm frontend:status
pnpm frontend:logs

pnpm api
pnpm api:recreate
pnpm api:restart
pnpm api:status
pnpm api:logs

pnpm stack
pnpm stack:restart
pnpm stack:status
pnpm stack:logs
```

`frontend` and `api` are the normal rebuild commands for service-local source changes. `frontend:recreate` and `api:recreate` are for environment-only changes when the image content is already correct. `stack` is reserved for changes that genuinely cross service boundaries or require the complete stack to be rebuilt.

## 9. Assistant operating requirement

For every future implementation/verification instruction, including in a new chat:

1. inspect which files/services changed;
2. decide whether any rebuild is required at all;
3. distinguish source/image changes from environment-only changes;
4. select the smallest service scope;
5. prefer the root package script for that scope;
6. explain broader rebuilds only when they are truly necessary;
7. never default to `pnpm stack` for convenience;
8. for any UI task, read and obey `docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md` before implementation.

This rule remains active unless the founder explicitly overrides it for a specific verification run.