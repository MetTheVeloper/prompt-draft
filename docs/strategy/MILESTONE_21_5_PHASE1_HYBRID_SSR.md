# Milestone 21.5 — Phase 1 Hybrid / SSR Architecture

Status: **IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION**

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

Nuxt now uses universal/server rendering by default:

```text
ssr: true
```

Explicit client-only route rules preserve the current application behavior for surfaces where SSR is not yet useful or where the current URL contract is not the final acquisition contract.

### SSR/default public surfaces

Current first SSR-capable acquisition surfaces include:

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
- `/prompts` and `/user` are public today, but their query-parameter URL contracts are not the final Prompt/Creator canonical acquisition routes.
- Public Prompt and Creator SEO routes should be designed deliberately in the later SEO platform phase instead of accidentally turning current query URLs into permanent indexing contracts.

---

## 3. Discovery SSR data path

Before Phase 1, `/discover/[slug]` loaded its sanitized public item collection only inside `onMounted()`.

That meant enabling global SSR alone would still produce server HTML without the discovery collection.

Phase 1 replaces the mount-only fetch with Nuxt `useAsyncData()`.

Current request path:

```text
SSR request
  -> /discover/<slug>
  -> useAsyncData
  -> usePublicDiscovery
  -> GET <NUXT_PUBLIC_API_BASE>/api/discover
  -> sanitized published presentation rows
  -> server-rendered HTML + serialized Nuxt payload
  -> client hydration
```

The public content boundary is unchanged:

```text
NO Prompt body
NO Prompt variants
NO private Draft data
NO private account data
```

If the discovery API is unavailable, the route does not deliberately fall back to protected/full Prompt content. The page returns the existing failure UX with an empty sanitized collection.

---

## 4. Existing SSR-safety audit

The Phase 1 audit found no obvious baseline blocker requiring an application-wide rewrite.

Important existing safety characteristics:

```text
browser-only plugins already use .client.ts where appropriate
useMenu guards server execution
useAuth guards client-only persistence/session behavior
useTheme is server-tolerant
useScreen provides server-safe initial values and initializes browser state client-side
browser media/image utilities perform DOM/browser work inside invoked functions rather than as required top-level render initialization
```

Therefore the selected architecture is route-policy-first rather than component-rewrite-first.

---

## 5. Deliberately retained compatibility pieces

Phase 1 does **not** remove the Milestone 21D post-generate SEO snapshot machinery yet.

Reason:

```text
old static release path must remain understandable/rollback-capable
  -> hybrid SSR must first be locally verified
  -> production Node runtime comes in Phase 2
  -> Cloudflare path comes in Phase 3
  -> redundant static SEO enrichment is cleaned up only when the new SEO platform is proven
```

The current `pnpm generate` command is therefore retained for compatibility, but it is no longer the correct command for validating hybrid SSR behavior.

---

## 6. Correct Phase 1 verification mode

Hybrid rendering requires the Nuxt/Nitro server runtime.

Founder-local verification should use:

```powershell
pnpm build
pnpm preview
```

with the independent API available at the configured:

```text
NUXT_PUBLIC_API_BASE
```

Default local value remains:

```text
http://127.0.0.1:4000
```

Do not use `pnpm generate` as the acceptance test for this phase because static generation does not exercise the hybrid server response model.

---

## 7. Acceptance checks

### A. Build/runtime

```text
pnpm build -> PASS
pnpm preview -> server starts successfully
```

### B. SSR discovery HTML

With the API running, request:

```text
/discover/posters-editorial
```

The raw HTTP response / View Source must contain before JavaScript execution:

```text
Posters & Editorial
route-specific SEO metadata
server-rendered discovery page structure
sanitized discovery item content when the API has matching published rows
Nuxt hydration payload
```

The route must remain interactive after hydration.

### C. Client-only regression smoke

Confirm these still behave as application/client routes:

```text
/create
/manage
/wizard/<known-wizard-id>
/prompts
/user
```

No SSR migration success should be declared if these regress.

### D. Public SSR smoke

Confirm:

```text
/
/guide
all six /discover/* routes
```

load without hydration/runtime errors.

---

## 8. Phase boundary

Phase 1 is code-complete but remains **AWAITING FOUNDER-LOCAL VERIFICATION** until the real local build/runtime and browser/raw-HTML checks pass.

After acceptance, Phase 2 begins:

```text
Docker production runtime
  -> Nuxt SSR Node service
  -> independent API service
  -> internal service networking
  -> production-like local runtime verification
```
