# Backend / Docker Status

Last updated: 2026-09-04

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is never sufficient.

## Milestones 1–5 — COMPLETE

The Docker/PostgreSQL backend foundation and Wizard-run reference implementation are complete and locally verified.

Verified platform path:

```text
static Nuxt frontend
  -> direct browser CORS
  -> Docker Node API :4000
  -> PostgreSQL
  -> named-volume durability
```

Milestone 5 History / Read API + UX remains available as the completed reference implementation.

## Reusable API playbook — COMPLETE

Reusable API implementation guidance lives in:

```text
docs/backend/API_GUIDE.md
```

It captures resource-first API design, numbered SQL schema files, parameterized DB access, HTTP validation/CORS, typed frontend boundaries, local-first failure semantics, direct UI verification, and `pnpm generate` as a release invariant.

## Milestone 6 — COMPLETE: Auth Foundation + Account-aware Cloud Draft Sync

Verified product path:

```text
optional account
  -> local-first /create drafts
  -> manual Cloud Save + dirty-aware autosync
  -> account-owned prompt_drafts rows
  -> GET /api/drafts recovery
  -> same-account multi-device merge
  -> per-draft Cloud state UI
```

Locally verified by the user:

```text
registration
logout and existing-account login
header profile behavior
Cloud Save ownership and revision updates
normal/Incognito same-account recovery
preservation of local-only drafts
Drafts-menu synced/dirty/offline states
pnpm generate
```

## Milestone 7 — COMPLETE: Server-side Translation

Verified product path:

```text
static TextField action
  -> Prompt Draft API :4000
  -> Docker-private LibreTranslate :5000
  -> Persian/English translation
```

Locally verified by the user:

```text
translator image and health lifecycle
en/fa model availability
backend status + translation endpoints
stable 503 while translator unavailable
real TextField translation via backend :4000
translation alternatives
{person} token preservation
translator stop disables Translate
translator restart re-enables Translate without page refresh
anonymous translation remains available
pnpm generate
```

## Milestone 8 — COMPLETE: Authorization / Roles Foundation

Goal achieved:

```text
authenticated account
  -> persisted role
  -> backend-authoritative permission resolution
  -> frontend authorization helpers
  -> permission-gated UI
  -> permission-gated routes
  -> permission-gated backend APIs
```

Current roles:

```text
user
admin
super_admin
```

Initial permission vocabulary:

```text
dashboard.view
system.metrics.view
users.view
users.manage
drafts.view_all
drafts.delete_any
system.settings.manage
```

`super_admin` receives wildcard `*`.

Implemented authorization foundation:

```text
backend/sql/005_add_user_roles.sql
backend/src/authorization.mjs
users.role defaults to user
one-time migration bootstrap promotes grass to super_admin
runtime privilege never checks usernames
auth login/register/me responses include role + resolved permissions
GET /api/admin/access-check requires dashboard.view
app/config/authorization.ts permission constants
useAuth(): role / permissions / isAdmin / isSuperAdmin / can / canAny / canAll
app/middleware/authorization.ts reusable route guard
/dashboard proof route requires dashboard.view
Profile Menu shows Dashboard only when permission is granted
/dashboard included in static prerender configuration
```

Authorization enforcement contract:

```text
UI visibility
  -> convenience only

route middleware
  -> blocks unauthorized navigation

backend permission guard
  -> authoritative security boundary
```

Local verification completed by the user on 2026-09-04:

```text
super_admin account shows Role: super admin
super_admin sees Dashboard action
super_admin opens /dashboard
/dashboard backend authorization reports Verified
normal user shows Role: user
normal user does not see Dashboard action
normal user direct /dashboard access returns 403 Forbidden
normal user direct GET /api/admin/access-check returns 403 Forbidden
```

Final static release verification:

```text
pnpm generate succeeds
13 initial routes prerender successfully
/dashboard is explicitly present in the prerender set
.output/public generated successfully
offline manifest generated successfully
```

Known duplicated-import, sourcemap, and large-chunk warnings remain non-blocking existing build warnings.

### Milestone 8 phases — ALL DONE

```text
Phase 1 — persisted roles + backend permission resolver: DONE
Phase 2 — frontend authorization helpers: DONE
Phase 3 — Dashboard proof route + conditional UI: DONE
Phase 4 — normal-user denial + backend bypass check + static generation: DONE
```

## Current intentional debt / deferred work

- real Dashboard metrics;
- Admin Panel / user-management UX;
- analytics/page-view event tracking for metrics such as visits and active users;
- convert `/history` from Wizard-run History to Draft History when selected;
- remove History from primary header navigation and add the relevant History entry to the Drafts menu as previously agreed;
- server-side Cloud Draft delete semantics;
- advanced multi-device conflict resolution beyond deterministic `updatedAt` merge;
- optimistic revision conflict enforcement;
- production auth rate limiting / abuse controls;
- translation rate limiting / abuse controls before public production exposure;
- email verification;
- password reset/recovery;
- OAuth/social login;
- production migration framework;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table remains non-product learning data and can be removed during cleanup.

## Next action

Milestone 8 is complete. Wait for the user's next product feature direction; do not infer or start another feature automatically.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/API_GUIDE.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/STATUS.md`
