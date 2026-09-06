# Milestone 21D — Deferred Near-Zero-Cost MVP Deployment / SSR Migration

Status: **DEFERRED / DESIGN-ONLY / NOT YET IMPLEMENTED**

Branch:

```text
feature/growth-foundation
```

Parent milestone:

```text
Milestone 21D — Public Discovery & SEO Foundation
```

Audited implementation baseline before this document:

```text
12ffbe34cb5401aaa0fba95e57199cb171a87fb9
Close Growth Foundation and advance to Domain Expansion
```

This document is a deferred continuation of Milestone 21D. It does **not** reopen the accepted Milestone 21 closure and does **not** authorize an immediate rendering/deployment migration.

Its purpose is to record the easiest known path from the current static deployment to a public MVP with real Nuxt SSR, an independent API, and an Iran-network fallback while keeping infrastructure cost close to zero.

Implementation begins only when production SSR/deployment work is explicitly selected.

---

## 1. Current baseline that must be preserved

The current release model is:

```text
Nuxt 4
ssr: false
pnpm generate
  -> nuxt generate
  -> generate-offline-manifest.ts
  -> generate-public-seo.ts
  -> .output/public
  -> GitHub Actions
  -> Arvan Object Storage / static hosting
```

Current backend model:

```text
browser
  -> independent Node API :4000
  -> PostgreSQL
  -> backend-only services/integrations
```

Current Docker stack:

```text
api         -> host port 4000
postgres    -> private Docker network
translator  -> private Docker network
```

The API already binds to:

```text
HOST=0.0.0.0
PORT=4000
```

Milestone 21D already provides reusable SEO foundations:

```text
six /discover/* public routes
usePublicSeo.ts
sanitized GET /api/discover
sitemap / robots generation
canonical/OG/Twitter metadata contracts
CollectionPage + ItemList structured data
build-time sanitized discovery snapshots
public/protected content boundary
```

None of these should be discarded during SSR migration.

---

## 2. Target MVP architecture

Primary/global path:

```text
                         Internet
                            |
                            v
                    prompt-draft.ir
                            |
                            v
                       Cloudflare
                            |
              +-------------+-------------+
              |                           |
        Nuxt SSR / Hybrid            Static Assets
        Cloudflare Worker            Workers Assets/CDN
              |
              | API requests
              v
                 api.prompt-draft.ir
                            |
                    Cloudflare Tunnel
                            |
                            v
                    Developer PC
                            |
                          Docker
                     +------+------+
                     |             |
                    API        PostgreSQL
```

Iran emergency path:

```text
                 independent backup .ir domain
                            |
                         Arvan DNS
                            |
                    Arvan static mirror
                            |
                     pnpm generate output

Optional emergency API, only if network prerequisites pass:

api.<backup-domain>.ir
        |
     Arvan DNS
        |
   public home IP
        |
 router / firewall
        |
 local reverse proxy
        |
   Docker API
```

The primary and emergency domains must use independent authoritative DNS providers so a Cloudflare outage or international-network isolation does not remove the emergency hostname.

---

## 3. Core migration rule: add SSR without throwing away the static release

The easiest safe path is **not**:

```text
remove static deployment
flip ssr:false -> true
move every route to SSR
switch production immediately
```

The selected path is:

```text
keep existing pnpm generate path
        +
add an SSR-capable Cloudflare deployment
        +
move only public routes that benefit from server rendering
        +
keep app-heavy routes client-oriented initially
```

This preserves an already verified static artifact for rollback and for the Iran emergency mirror.

`pnpm generate` therefore remains a required release capability even after Cloudflare SSR is introduced.

---

## 4. Rendering migration strategy

The long-term target is hybrid rendering.

### First SSR / server-rendering candidates

```text
/discover/**
future /blog/**
future /p/** public Prompt presentation pages
future /creator/** public creator pages
future dynamic search/category acquisition pages where static generation becomes insufficient
```

### Routes that should remain client-heavy first

At initial migration, do not spend time converting authenticated/tool surfaces merely to claim global SSR:

```text
/create
/manage/**
/login
/history
/collage
/vectorizer
/user initially
/wizard/** initially unless a separate public SEO need is approved
other browser/tool-heavy routes found by the SSR audit
```

`/prompts` is public as a catalog, but its current query-driven list/detail behavior should not be forced into the first SSR slice. Public canonical Prompt pages can later move to `/p/<id-or-slug>` while the existing application route remains compatible.

### Important Nuxt configuration consequence

The project currently has:

```text
ssr: false
```

True per-route SSR requires an SSR-capable Nuxt build. At implementation time the configuration must be changed deliberately so the application can produce a Nitro server output, while client-only route rules and/or client guards preserve browser-heavy surfaces.

Do **not** flip the global setting and ship before auditing browser-only dependencies such as:

```text
window / document / localStorage access
Capacitor APIs
media/file APIs
FFmpeg/browser workers
DOM-dependent libraries
client-only authentication bootstrapping
```

Use route rules, `import.meta.client`, lazy client imports and `<ClientOnly>` only where the audit proves they are necessary.

---

## 5. Cloudflare becomes the primary frontend runtime

Current Cloudflare Workers documentation supports existing Nuxt applications with a Nitro output shaped as:

```text
main   -> .output/server/index.mjs
assets -> .output/public
```

The production SSR path should therefore use:

```text
pnpm build
```

rather than replacing the existing `pnpm generate` command.

Expected future repository additions:

```text
wrangler.jsonc                         # if explicit config is preferred/required
.github/workflows/deploy-cloudflare.yml
```

Do not overwrite the current Arvan static deployment workflow during the first migration.

Recommended deployment split:

```text
pnpm build
  -> Cloudflare Worker / primary runtime

pnpm generate
  -> Arvan static mirror / emergency artifact
```

As of 2026-09-06, Cloudflare documents the Workers Free plan as 100,000 Worker requests/day, 10 ms CPU/request and 128 MB memory. Requests served directly as static assets are documented as free/unlimited rather than Worker invocations.

These numbers are implementation-time assumptions, **not permanent architecture guarantees**. Re-check Cloudflare pricing and limits immediately before activation.

---

## 6. Preserve the Milestone 21D SEO work during the transition

The current 21D solution is a bridge, not dead code.

Keep:

```text
usePublicSeo.ts
/api/discover sanitized projection
public URL conventions
sitemap/robots contracts
structured-data rules
safe public-field boundary
```

The current `generate-public-seo.ts` path remains valuable for the static Arvan mirror even after Cloudflare SSR exists.

For a route that becomes verified SSR on Cloudflare:

```text
Cloudflare primary
  -> route-specific HTML produced by Nuxt/Nitro

Arvan emergency mirror
  -> route-specific static HTML still produced/enriched during pnpm generate
```

Do not expose Prompt body/variants merely to make SSR convenient.

---

## 7. Public availability must not depend on the developer PC

A critical invariant for the MVP is:

> Turning off the developer PC may disable API-backed product actions, but it must not take down the public website or its primary SEO surfaces.

Avoid this hard dependency for public rendering:

```text
request
  -> Cloudflare SSR
  -> api.prompt-draft.ir
  -> developer PC
  -> required before public HTML can render
```

For public/SEO content, prefer in this order:

```text
1. prerender/static data when freshness allows
2. build-time sanitized snapshots
3. Cloudflare-side cache/storage when later justified
4. live home-API fetch only as optional enhancement, never the sole public-page source
```

The existing sanitized discovery projection is already the correct security boundary for generating public snapshots.

A future public datastore may be introduced only when catalog freshness/scale proves it necessary.

---

## 8. Primary API path: Cloudflare Tunnel -> local Docker

Normal MVP API routing:

```text
https://api.prompt-draft.ir
        |
     Cloudflare
        |
  Cloudflare Tunnel
        |
 http://localhost:4000
        |
   Docker API
```

The tunnel should be initiated from the developer machine. No home router port-forward is required for the normal path.

Expected implementation work:

```text
create named Cloudflare Tunnel
map api.prompt-draft.ir to the tunnel
route tunnel service to local API
run cloudflared persistently on the developer machine
update production CORS_ORIGINS
set NUXT_PUBLIC_API_BASE=https://api.prompt-draft.ir
verify auth/session behavior over HTTPS
```

PostgreSQL must never be exposed publicly.

The normal production API should remain tunnel-only until there is a real reason to expose an inbound home route.

---

## 9. DNS migration order for prompt-draft.ir

Current production DNS is managed by Arvan.

Do not change IRNIC nameservers first.

Safe order:

```text
1. Add prompt-draft.ir to Cloudflare.
2. Recreate/audit all current DNS records in Cloudflare.
3. Deploy and verify the Nuxt Worker on a staging/Workers hostname.
4. Configure api.prompt-draft.ir + Tunnel.
5. Verify frontend, API, auth, SEO HTML and assets before DNS cutover.
6. Change IRNIC authoritative nameservers from Arvan to the Cloudflare nameservers assigned to the zone.
7. Bind prompt-draft.ir/www to the Cloudflare frontend runtime.
8. Keep Arvan deployment alive independently as the emergency mirror.
```

Do not mix normal Arvan and Cloudflare authoritative nameservers for the same zone as an ad-hoc failover mechanism.

---

## 10. Independent Arvan emergency mirror

Use one of the existing spare `.ir` domains as the emergency site domain.

Example only:

```text
<backup-domain>.ir
```

Its authoritative DNS remains on Arvan.

Target:

```text
<backup-domain>.ir
        |
     Arvan DNS
        |
 Arvan static hosting/object storage
        |
 .output/public from pnpm generate
```

The current `.github/workflows/deploy-web.yml` already provides most of this static deployment path and should be retained/reused rather than deleted.

The backup site must not require Cloudflare DNS, Cloudflare Workers or Cloudflare Tunnel merely to load public content.

Minimum emergency content target:

```text
landing/public shell
discovery pages
future blog pages
future public Prompt pages that can be generated
CSS / JS / images
robots/sitemap appropriate to the backup-domain policy
```

Whether the backup domain should be indexable by search engines is a separate SEO decision. Default implementation should avoid creating duplicate-indexing/canonical conflicts with the primary domain.

---

## 11. Optional Iran emergency API

This is a secondary disaster-recovery layer and is **not required to launch the first public MVP**.

Potential path:

```text
api.<backup-domain>.ir
        |
     Arvan DNS
        |
    public IP
        |
      router
        |
 firewall/reverse proxy
        |
    Docker API
```

This path is valid only after verifying all of the following:

```text
ISP provides a publicly routable inbound connection
connection is not unusably behind CGNAT
router port forwarding works
host firewall rules are explicit
TLS can be maintained
IP changes can be reflected in DNS when needed
API rate limiting / auth / logging are safe for direct exposure
```

Prefer exposing a hardened reverse proxy on HTTPS/443 rather than publishing Docker port `4000` directly.

If the public-IP/CGNAT test fails, mark emergency API as unavailable and keep the emergency site read-only/static. Do not distort the main architecture merely to force this fallback.

---

## 12. Graceful degradation when the PC is offline

Expected primary-domain behavior with the developer PC off:

```text
public frontend             -> AVAILABLE
Cloudflare static assets    -> AVAILABLE
public prerendered content  -> AVAILABLE
SSR routes not hard-bound to home API -> AVAILABLE

login/API                   -> UNAVAILABLE
cloud Draft save/sync       -> UNAVAILABLE
admin                       -> UNAVAILABLE
server-backed account data  -> UNAVAILABLE
```

The UI must represent API unavailability as a recoverable service state rather than crashing the entire application.

Local-first editor behavior should continue where existing product semantics permit it.

---

## 13. Lowest-risk implementation sequence

### Phase A — Compatibility spike, no production change

```text
keep ssr:false production invariant
keep Arvan production untouched
create Cloudflare project/account configuration
prove that the current repository can build/deploy a minimal Nuxt Worker target
measure Worker CPU/memory on representative pages
```

Exit gate:

```text
Cloudflare deployment works without changing production DNS.
```

### Phase B — Hybrid rendering audit

```text
audit pages/components for browser-only assumptions
introduce SSR-capable Nuxt configuration
explicitly keep tool/auth routes client-only initially
make /discover/** the first controlled public rendering proof
```

Exit gate:

```text
server response for a controlled public route contains useful route-specific HTML before JavaScript execution
existing client-heavy routes still behave correctly
```

### Phase C — Dual build contract

Verify both commands on every relevant release candidate:

```text
pnpm build      # Cloudflare primary
pnpm generate   # Arvan emergency mirror
```

Do not accept an SSR migration that silently breaks the static emergency artifact.

### Phase D — API Tunnel

```text
create api.prompt-draft.ir
Cloudflare Tunnel -> local :4000
production CORS update
HTTPS/auth/API smoke tests
```

Exit gate:

```text
frontend reaches the current Docker backend through the public API hostname without router port-forwarding.
```

### Phase E — Primary domain cutover

Only after staging verification:

```text
IRNIC nameservers -> Cloudflare
prompt-draft.ir -> Cloudflare Nuxt runtime
api.prompt-draft.ir -> Cloudflare Tunnel
```

Keep the Arvan mirror available throughout cutover.

### Phase F — Independent Iran fallback

```text
spare .ir domain -> Arvan DNS
pnpm generate artifact -> Arvan static hosting
verify site has no Cloudflare dependency
```

### Phase G — Optional emergency API

Run public-IP/CGNAT/security tests. Implement only if the result is actually reliable.

---

## 14. Expected repository touchpoints when implementation starts

Likely files:

```text
nuxt.config.ts
package.json
wrangler.jsonc                                  # new if needed
.github/workflows/deploy-cloudflare.yml          # new
.github/workflows/deploy-web.yml                 # retain; adapt for backup mirror if needed
.env.example
compose.yaml                                    # CORS/env adjustments only unless proven otherwise
app/composables/usePublicSeo.ts                  # preserve/reuse
scripts/generate-public-seo.ts                   # preserve for static mirror
```

Do not move PostgreSQL or the current Node API into the Nuxt Worker merely to simplify deployment. Backend migration is a separate future infrastructure step.

---

## 15. Acceptance checklist for the MVP architecture

Primary frontend:

```text
[ ] pnpm build passes
[ ] Cloudflare deployment passes
[ ] representative SSR route contains meaningful HTML before JS
[ ] static assets are served correctly
[ ] EN/FA client behavior still works
[ ] app-heavy/client-only routes still work
[ ] canonical/OG/Twitter metadata remains correct
[ ] sitemap/robots remain correct for primary domain
[ ] protected Prompt body/variants remain private
```

Primary API:

```text
[ ] api.prompt-draft.ir resolves through Cloudflare
[ ] Tunnel reaches Docker API :4000
[ ] production CORS is explicit
[ ] auth/session smoke passes over public HTTPS
[ ] PostgreSQL has no public exposure
```

Offline-PC behavior:

```text
[ ] main public site still loads
[ ] public SEO content does not require home API to produce basic HTML
[ ] API failures degrade gracefully
```

Emergency mirror:

```text
[ ] independent backup domain uses Arvan authoritative DNS
[ ] pnpm generate still passes
[ ] Arvan mirror can load independently of Cloudflare
[ ] duplicate-indexing policy is explicit
```

Optional emergency API:

```text
[ ] public-IP/CGNAT test passes
[ ] HTTPS reverse proxy exists
[ ] firewall/port forwarding is explicit
[ ] no direct database exposure
[ ] fallback hostname uses the independent Arvan-managed domain
```

---

## 16. Rollback model

Before main-domain cutover, rollback is trivial because Arvan remains production.

After cutover:

```text
Cloudflare application regression
  -> rollback Worker deployment/configuration

home API unavailable
  -> public site stays online; API features degrade

international/Cloudflare access failure inside Iran
  -> users can use the independent Arvan backup domain

long Cloudflare/DNS incident requiring main-domain recovery
  -> IRNIC nameservers can be moved back to a prepared Arvan zone,
     but this is disaster recovery and DNS propagation is not instant
```

The independent backup domain exists specifically so emergency availability does not depend on waiting for a nameserver change.

---

## 17. Cost model

Target MVP compute/storage model:

```text
Nuxt primary runtime/CDN       -> Cloudflare free-tier oriented
Nuxt SSR                       -> Cloudflare Workers free-tier oriented
primary API ingress            -> Cloudflare Tunnel
backend compute                -> developer PC
PostgreSQL                     -> developer PC
Iran static fallback           -> existing Arvan static/object-storage path
backup domain                  -> existing spare .ir domain
optional emergency API compute -> developer PC
```

This is **near-zero-cost**, not a promise of permanently zero cost.

Existing domain, electricity, internet, Arvan storage/traffic and future provider-plan changes can still create cost. Provider pricing/limits must be re-audited at implementation time.

---

## 18. Future paid migration

When stable paid infrastructure becomes available, the intended move is primarily:

```text
Developer PC
  -> VPS / managed backend host

local PostgreSQL
  -> managed or VPS PostgreSQL
```

The following should ideally remain stable:

```text
prompt-draft.ir
Cloudflare frontend
hybrid Nuxt rendering strategy
api.prompt-draft.ir
frontend API contract
Arvan emergency mirror
```

The near-zero-cost MVP is therefore a stepping stone to normal production infrastructure, not a throwaway architecture.

---

## 19. Re-check before implementation

External assumptions change. Before executing this document, re-check official provider documentation, especially:

```text
https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/nuxt/
https://developers.cloudflare.com/workers/platform/limits/
https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
https://developers.cloudflare.com/tunnel/routing/
```

Also re-audit the then-current Prompt Draft branch before changing rendering mode. New pages or browser-only dependencies added after this document may change the safest client/SSR split.

---

## Final deferred decision

When the deployment/SSR trigger is reached, the preferred path is:

```text
KEEP
  current static generate capability
  current Milestone 21D SEO contracts
  independent Node API
  Docker/PostgreSQL backend

ADD
  Cloudflare DNS
  Cloudflare Nuxt Worker runtime
  hybrid SSR/public rendering
  Cloudflare Tunnel for api.prompt-draft.ir
  independent Arvan backup domain/static mirror

OPTIONALLY ADD
  Arvan-DNS -> public-IP -> local API emergency path
  only after CGNAT/security/network verification
```

Until that trigger, this file is a **design reference only** and the accepted production invariant remains the current static deployment.