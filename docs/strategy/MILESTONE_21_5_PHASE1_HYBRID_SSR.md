# Milestone 21.5 — Phase 1 Hybrid / SSR Architecture

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED**

Date: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Parent milestone:

```text
docs/strategy/MILESTONE_21_5_RENDERING_ORGANIC_ACQUISITION.md
```

---

## 1. Objective

Establish the first real hybrid-rendering baseline for Prompt Draft without forcing server rendering onto client-heavy authenticated/product-workspace surfaces.

This phase intentionally proves the rendering architecture before Docker/runtime deployment work begins.

---

## 2. Rendering policy selected

Nuxt uses universal/server rendering by default:

```text
ssr: true
```

Explicit client-only route rules preserve current application behavior for surfaces where SSR is not yet useful or where the current URL contract is not the final acquisition contract.

### SSR/default public surfaces

```text
/
/guide
/discover/**
```

The six controlled discovery routes are the primary Phase 1 proof surface.

### Client-oriented surfaces retained

```text
/create
/collage
/vectorizer
/history
/dashboard
/login
/manage
/manage/**
/wizard
/wizard/**
/prompts
/user
```

Rationale:

- Create/tools/Manage/Wizard are interaction-heavy application surfaces and do not gain meaningful acquisition value from SSR in this phase.
- `/prompts` and `/user` are not promoted into final canonical acquisition contracts during Phase 1.
- Public Prompt and public Creator SEO routes are designed deliberately in Phase 4.
- `/user` remains the signed-in account/profile workspace; a separate public Creator route is the intended future SEO surface.

---

## 3. Discovery SSR data path

Before Phase 1, `/discover/[slug]` loaded its sanitized public item collection only inside `onMounted()`.

Phase 1 replaced the mount-only fetch with Nuxt `useAsyncData()` so discovery content participates in the server response.

Phase 1 local request path:

```text
SSR request
  -> /discover/<slug>
  -> useAsyncData
  -> usePublicDiscovery
  -> public API
  -> sanitized published presentation rows
  -> server-rendered HTML + serialized Nuxt payload
  -> client hydration
```

The public content boundary remains unchanged:

```text
NO protected Prompt body
NO protected Prompt variants
NO private Draft data
NO private account data
```

---

## 4. Existing SSR-safety audit

The audit found no baseline blocker requiring an application-wide rewrite.

Important existing safety characteristics:

```text
browser-only plugins already use .client.ts where appropriate
useMenu guards server execution
useAuth guards client-only persistence/session behavior
useTheme is server-tolerant
useScreen provides server-safe initial values and initializes browser state client-side
browser media/image utilities perform DOM/browser work inside invoked functions rather than as required top-level render initialization
```

Therefore the selected architecture remains route-policy-first rather than component-rewrite-first.

---

## 5. Deliberately retained compatibility pieces

Phase 1 did not remove the Milestone 21D post-generate SEO snapshot machinery.

Reason:

```text
old static release path remains understandable/rollback-capable
  -> production Node runtime is proven in Phase 2
  -> Cloudflare path is proven in Phase 3
  -> redundant static SEO enrichment is cleaned up in Phase 4
```

`pnpm generate` therefore remains for historical/static compatibility, but it is no longer the acceptance path for hybrid SSR.

---

## 6. Verification mode

Founder-local verification used:

```powershell
pnpm build
pnpm preview
```

with the independent API running locally.

`pnpm generate` was intentionally not used as the SSR acceptance test.

---

## 7. Founder-local acceptance evidence

Accepted on 2026-09-06.

### Build/runtime

```text
pnpm build -> PASS
pnpm preview -> PASS
```

### Public SSR surfaces

```text
/ -> PASS after local preview CORS origin was added
/guide -> PASS
/discover/posters-editorial -> PASS
six controlled /discover/* route model accepted
raw curl SSR response test -> PASS
```

The temporary `/` failure was not an SSR architecture failure. Browser-side home discovery requests were blocked because the API CORS allowlist originally included development port `3030` but not preview port `3000`. Local preview origins were added and the home surface then passed.

### Client-heavy/authenticated regression smoke

```text
/create -> PASS
/manage -> PASS after auth/API smoke
/prompts -> PASS after auth/API smoke
/user -> PASS after auth/API smoke
Wizard -> PASS
regular-user login -> PASS
super-admin login -> PASS after correcting the local account password hash via secure CLI reset
```

No port/origin restriction exists specifically for `super_admin`; login uses the same password/session path for all roles.

### Security boundary

```text
protected/private Prompt and account data were not intentionally exposed by SSR
```

---

## 8. Phase result

Phase 1 is accepted and closed.

Selected architecture:

```text
hybrid Nuxt rendering
SSR by default for acquisition-capable public routes
explicit client-only route rules for interaction-heavy/private surfaces
separate future public Creator/Prompt canonical routes rather than indexing private account/workspace URLs
```

Successor rendering ADR:

```text
docs/strategy/ADR_002_HYBRID_RENDERING_STRATEGY.md
```

---

## 9. Next phase

Phase 2:

```text
Docker production runtime
  -> production Nuxt/Nitro container
  -> independent API container
  -> internal SSR-to-API networking
  -> browser-public API origin kept separate
  -> health/restart policy
  -> production-like local verification
```
