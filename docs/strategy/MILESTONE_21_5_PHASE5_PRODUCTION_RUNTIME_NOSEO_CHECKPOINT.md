# Milestone 21.5 — Phase 5 Production Runtime / SEO Deferred Checkpoint

Status: **FOUNDER RUNTIME VERIFIED / PRODUCTION RUNTIME ACTIVE / SEO LAUNCH DEFERRED**

Date: 2026-09-13

Branch:

```text
feature/growth-foundation
```

Verified source HEAD before runtime environment cutover:

```text
ee10c928d7c144e25f94e2e6645e0521b5d3776c
```

Canonical parent sources:

```text
docs/strategy/MILESTONE_21_5_PHASE5_LAUNCH_READINESS.md
docs/strategy/MILESTONE_21_5_PHASE5_1C_PRODUCTION_CUTOVER_RUNBOOK.md
```

This checkpoint records the founder-approved intermediate operating state reached on 2026-09-13. It amends the earlier Phase 5.1C assumption that staging frontend ingress had to be retired before production runtime activation. Where this checkpoint conflicts with the older runbook, this checkpoint is authoritative for the current runtime state.

---

## 1. Accepted decision

Prompt Draft is now intentionally operating as:

```text
Production runtime      -> ON
Production domain/API   -> ON
Production canonical    -> ON
SEO/indexing launch     -> OFF / DEFERRED
Search Console launch   -> DEFERRED
```

The founder explicitly decided that the project is still under active development/testing and should use the real production runtime without becoming publicly indexable yet.

This is not an accidental partial launch. It is the accepted current operating mode.

---

## 2. Host-aware indexing guard

The frontend now has an explicit host-aware runtime indexing policy:

```text
canonical indexable host -> prompt-draft.ir
all other hosts           -> forced noindex when indexing is otherwise enabled
explicit global noindex   -> always wins
```

Implementation:

```text
shared/public-indexing-policy.ts
server/middleware/staging-noindex.ts
server/routes/robots.txt.ts
server/routes/sitemap.xml.ts
server/routes/llms.txt.ts
```

Focused verification passed:

```text
pnpm test:robots-policy -> PASS 9/9
pnpm frontend           -> PASS / fresh Nuxt + Nitro image built
```

Therefore one frontend container may safely serve both production and staging while the host-aware guard remains in place.

Important precedence:

```text
NUXT_PUBLIC_NOINDEX=true
```

still forces noindex for every host, including `prompt-draft.ir`.

When a future founder-approved SEO launch sets it to false, only the exact canonical apex `prompt-draft.ir` may become indexable; `grassic.ir`, `www.prompt-draft.ir`, preview/unknown hosts remain guarded by request hostname.

---

## 3. Current private runtime environment direction

The founder applied the following non-secret runtime direction locally:

```text
NUXT_PUBLIC_API_BASE=https://api.prompt-draft.ir
NUXT_PUBLIC_SITE_URL=https://prompt-draft.ir
NUXT_PUBLIC_NOINDEX=true
CORS_ORIGINS includes https://prompt-draft.ir and https://grassic.ir
FRONTEND_BIND_ADDRESS=127.0.0.1
API_BIND_ADDRESS=127.0.0.1
```

Secrets and unrelated environment values were preserved.

The environment-only change used service recreation, not rebuild:

```text
pnpm api:recreate
pnpm frontend:recreate
```

A private `.env` backup was created outside the repository before the change.

---

## 4. Founder runtime verification evidence

On 2026-09-13 the founder verified:

```text
API container        -> healthy
frontend container   -> healthy
database             -> healthy
translator           -> healthy
```

Production API CORS:

```text
GET https://api.prompt-draft.ir/api/public/inventory
Origin: https://prompt-draft.ir
-> HTTP 200
-> Access-Control-Allow-Origin: https://prompt-draft.ir
-> CF-Cache-Status: DYNAMIC
```

Staging browser-origin compatibility retained against the production API endpoint:

```text
GET https://api.prompt-draft.ir/api/public/inventory
Origin: https://grassic.ir
-> HTTP 200
-> Access-Control-Allow-Origin: https://grassic.ir
-> CF-Cache-Status: DYNAMIC
```

Production frontend:

```text
https://prompt-draft.ir/
-> HTTP 200
-> Nuxt
-> X-Robots-Tag: noindex, nofollow, noarchive
```

Staging frontend:

```text
https://grassic.ir/
-> HTTP 200
-> Nuxt
-> X-Robots-Tag: noindex, nofollow, noarchive
```

Production Blog SSR evidence:

```text
canonical     -> https://prompt-draft.ir/blog
hreflang EN   -> https://prompt-draft.ir/blog
hreflang FA   -> https://prompt-draft.ir/fa/blog
x-default     -> https://prompt-draft.ir/blog
OG URL        -> https://prompt-draft.ir/blog
robots meta   -> noindex, nofollow, noarchive
runtime API   -> https://api.prompt-draft.ir
runtime site  -> https://prompt-draft.ir
runtime noindex -> true
```

No `grassic.ir` canonical leakage was observed in the verified production Blog SSR response.

---

## 5. Cloudflare robots injection observation

The production `/robots.txt` response currently includes a Cloudflare-managed Content Signals preamble before the application-generated robots policy.

Observed Cloudflare-managed signal includes:

```text
Content-Signal: search=yes,ai-train=no,use=reference
```

and bot-specific restrictions such as GPTBot/Google-Extended/ClaudeBot blocks.

This Cloudflare-managed content does **not** replace the application page-level noindex guard. Current production HTML still returns both:

```text
X-Robots-Tag: noindex, nofollow, noarchive
<meta name="robots" content="noindex, nofollow, noarchive">
```

Therefore the accepted current state remains SEO OFF.

Do not alter Cloudflare Content Signals merely to make the site noindex; the application noindex contract is the launch gate. Any future Cloudflare crawler/content-signal policy change should be treated as a separate explicit policy decision.

---

## 6. Current production/staging contract

Current accepted state:

```text
prompt-draft.ir
  -> production runtime
  -> production canonical URLs
  -> browser API api.prompt-draft.ir
  -> noindex ON

grassic.ir
  -> retained staging/test frontend
  -> noindex ON

api.prompt-draft.ir
  -> production API runtime
  -> allows production browser origin
  -> also allows retained grassic.ir staging browser origin
  -> Cloudflare API cache bypass remains required
```

No staging frontend retirement is currently required while global noindex remains true.

The previous runbook statement that host-aware indexability was outside the accepted initial cutover is superseded by the verified host-aware implementation and this checkpoint.

---

## 7. SEO launch remains a separate future approval gate

Do **not** set:

```text
NUXT_PUBLIC_NOINDEX=false
```

without a new explicit founder approval in that turn.

Before a future SEO launch:

```text
1. re-read latest branch and this checkpoint
2. verify current production runtime health
3. verify prompt-draft.ir canonical/SSR/public route behavior
4. verify production API + CORS
5. verify robots/sitemap/llms runtime behavior
6. confirm Search Console property/ownership plan
7. explicitly approve production indexing
8. change only the required noindex/indexability runtime value(s)
9. recreate only the frontend when only frontend env changed
10. verify prompt-draft.ir loses page-level noindex
11. verify grassic.ir remains noindex through the host-aware guard
12. only then proceed to sitemap submission/indexing launch work
```

Search Console sitemap submission and acquisition launch measurement cadence remain deferred until that explicit SEO launch.

---

## 8. Rollback direction for the current intermediate state

If production runtime values need to be rolled back before SEO launch, restore the private `.env` backup and recreate only affected services.

The current rollback does **not** require a database restore because this checkpoint changed no schema, migration, database volume, or business data.

Do not roll back the verified host-aware source implementation merely because runtime environment values are reverted; code rollback should require a concrete source defect.

---

## 9. Next development mode

Prompt Draft may continue normal feature development and production-domain testing in this state.

The important invariant is:

```text
real production runtime
+
real production canonical/API
+
NOINDEX remains active
```

This keeps production-like behavior testable without opening the SEO acquisition surface before the product is ready.
