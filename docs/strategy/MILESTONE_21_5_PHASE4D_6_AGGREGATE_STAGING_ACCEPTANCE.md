# Milestone 21.5 — Phase 4D.6 Aggregate Regression + Staging Acceptance

Status: **IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Parent source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4D_SITEMAP_ROBOTS_AI_DISCOVERY.md
```

Operational verification rule:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

Accepted dependencies:

```text
4D.2 shared public inventory + sitemap                     ACCEPTED
4D.3 robots normalization + staging precedence             ACCEPTED
4D.4 llms.txt shared public-inventory projection            ACCEPTED
4D.5 native Discovery structured data + legacy retirement  ACCEPTED 2026-09-09
```

---

## 1. Purpose

4D.6 is the final Phase 4D acceptance gate.

It does not introduce a new public/indexability policy. Its job is to prove that all accepted 4D slices work together without regressing the accepted 4A–4C public architecture.

Final proof has three layers:

```text
A. aggregate source/backend/frontend regression
B. real external grassic.ir / api.grassic.ir staging smoke
C. one fresh production-like legacy static generation
```

No full-stack rebuild is part of this verification by default.

The current frontend image was already rebuilt successfully during 4D.5 verification, and 4D.6 adds only verification scripts/documentation/package commands.

---

## 2. 4D.5 acceptance evidence inherited by 4D.6

The founder explicitly authorized 4D.5 acceptance on 2026-09-09 after reviewing the focused tests, successful frontend build, and raw EN/FA staging SSR source.

Focused gates:

```text
pnpm test:discovery-seo
-> 8 tests / 8 pass / 0 fail

pnpm test:public-url-inventory
-> 7 tests / 7 pass / 0 fail
```

Frontend production build:

```text
pnpm frontend
-> Nuxt client build PASS
-> Nuxt server build PASS
-> Nitro node-server build PASS
-> Docker image built
-> frontend container started
```

A build-only Nitro path issue discovered during verification was fixed without changing the 4D.5 policy:

```text
app/shared/public-discovery.ts
  -> actual shared Discovery catalog inside Nuxt srcDir

shared/public-discovery.ts
  -> thin re-export shim for root scripts/tests
```

This preserves one Discovery catalog while preventing a raw root-relative TypeScript import from surviving into generated `.nuxt/dist/server/server.mjs`.

The Docker Corepack bootstrap was also hardened independently after a transient Docker-network failure:

```text
pnpm bootstrap occurs before package.json COPY
pnpm version pinned to 11.6.0
retry + IPv4-first bootstrap behavior
```

Final EN staging source (`/discover/portrait-photography`) proved:

```text
localized EN title + description
self canonical https://grassic.ir/discover/portrait-photography
EN/FA reciprocal hreflang + x-default
staging noindex meta
OG/Twitter image
native CollectionPage -> ItemList -> CreativeWork JSON-LD
canonical /prompt/:id structured URLs
visible canonical /prompt/:id links
no /prompts?id= legacy detail links
no /user?un= legacy Creator detail links
no protected/private serialized fields detected
```

Final FA staging source (`/fa/discover/portrait-photography`) proved:

```text
html lang=fa-IR / dir=rtl
localized Persian title + description
self canonical https://grassic.ir/fa/discover/portrait-photography
EN/FA reciprocal hreflang + x-default
staging noindex meta
native CollectionPage -> ItemList -> CreativeWork JSON-LD
canonical /fa/prompt/:id structured URLs
visible canonical /fa/prompt/:id links
no /prompts?id= legacy detail links
no /user?un= legacy Creator detail links
no protected/private serialized fields detected
```

The current Discovery fixture did not expose Creator attribution in those 18 items, so runtime `author` was naturally absent. The focused 4D.5 contract test separately proved that when approved Creator attribution is present, structured data uses canonical localized `/creator/:username` URLs and only public username identity.

The production-like fresh static-generation proof intentionally moves into 4D.6 so it is run once at the aggregate final gate rather than repeatedly during 4D.5 debugging.

Therefore:

```text
4D.5 -> DONE / FOUNDER-LOCAL + STAGING SSR VERIFIED / ACCEPTED 2026-09-09
```

---

## 3. Gate A — aggregate Phase 4D regression

Command:

```powershell
pnpm test:phase4d-final
```

Implementation:

```text
scripts/phase4d-final-regression.mjs
```

This command intentionally performs no rebuild.

It runs:

```text
1. pnpm test:phase4c-final
   -> accepted 4A–4C backend/frontend/privacy/routing/localization baseline

2. pnpm test:public-url-inventory
   -> one canonical public inventory + sitemap projection

3. pnpm test:robots-policy
   -> shared application noindex policy + robots/static/runtime contract

4. pnpm test:llms-discovery
   -> llms.txt shared inventory + privacy + noindex/runtime contract

5. pnpm test:discovery-seo
   -> shared Discovery catalog + native JSON-LD + legacy-generator retirement
```

Why 4C aggregate is included:

```text
4D changes crawler/public acquisition projection around Prompt + Creator + Discovery.
The final gate must prove that accepted Creator policy, Prompt protection, locale routing,
and the final 4B public/protected boundary were not weakened while 4D was implemented.
```

Expected result:

```text
[phase4d-final] PASS
```

---

## 4. Gate B — external staging/Cloudflare smoke

Command:

```powershell
pnpm smoke:phase4d-final
```

Implementation:

```text
scripts/phase4d-final-staging-smoke.mjs
```

Default targets:

```text
https://grassic.ir
https://api.grassic.ir
```

Safety guard:

```text
prompt-draft.ir is explicitly rejected as a smoke target
```

The smoke dynamically reads:

```text
GET /api/public/inventory
```

and chooses:

```text
one authoritative EN+FA public Prompt
one indexable + discoverable EN+FA public Creator
```

No hard-coded Prompt id or Creator fixture is required for the final 4D smoke.

### 4.1 Public inventory / privacy

Must prove:

```text
GET https://api.grassic.ir/api/public/inventory -> 200
ok=true
only prompts + creators inventory families
Prompt inventory entry -> id + availableLocales only
Creator inventory entry -> username + availableLocales + policy only
policy -> indexable + discoverable only
no private/protected serialized keys
```

### 4.2 Protected boundary

For the selected public Prompt id:

```text
GET https://api.grassic.ir/api/archive/:id unauthenticated
-> 401 or 403
```

A sitemap/AI-discovery change may never make the protected Archive detail public.

### 4.3 External robots.txt

Must prove at the Cloudflare staging edge:

```text
GET https://grassic.ir/robots.txt -> 200
X-Robots-Tag contains noindex
User-agent: *
Allow: /
no global Disallow: /
all accepted application/private disallows in EN + FA
no Sitemap declaration while staging global noindex is active
```

### 4.4 External sitemap.xml

Must prove:

```text
GET https://grassic.ir/sitemap.xml -> 200
X-Robots-Tag contains noindex
Cache-Control contains no-store
valid urlset document
<url> count = 0 under staging global noindex
no /prompts?id=
no /user?un=
no private/protected serialized fields
```

### 4.5 External llms.txt

Must prove:

```text
GET https://grassic.ir/llms.txt -> 200
X-Robots-Tag contains noindex
Cache-Control contains no-store
orientation-only staging message
canonical Markdown link count = 0
no /prompts?id=
no /user?un=
no private/protected serialized fields
```

### 4.6 Representative EN + FA public routes

The dynamic representative Prompt and Creator plus fixed Discovery category are checked in both locale spaces:

```text
/prompt/:id
/fa/prompt/:id

/creator/:username
/fa/creator/:username

/discover/portrait-photography
/fa/discover/portrait-photography
```

Each route must preserve:

```text
200 response
staging X-Robots-Tag noindex
staging robots meta noindex
correct html lang + dir
self canonical
reciprocal EN/FA hreflang
x-default
public-safe structured data
no legacy detail links
no protected/private serialized fields
```

Structured-data expectations:

```text
Prompt    -> CreativeWork
Creator   -> ProfilePage + Person
Discovery -> CollectionPage + ItemList + canonical localized Prompt URLs
```

Discovery must also have no legacy post-generator markers:

```text
data-public-seo-snapshot
data-public-seo-structured
```

Expected result:

```text
[phase4d-smoke] PASS
```

---

## 5. Gate C — production-like static compatibility

Command:

```powershell
pnpm verify:phase4d-static
```

Implementation:

```text
scripts/phase4d-static-generate-verification.mjs
```

This is the only intentionally expensive gate in 4D.6.

It first requires the already-running local API at:

```text
http://127.0.0.1:4000
```

Then it starts one fresh `pnpm generate` child process with isolated environment overrides:

```text
NUXT_PUBLIC_SITE_URL=https://example.test
NUXT_PUBLIC_API_BASE=http://127.0.0.1:4000
NUXT_API_BASE_INTERNAL=http://127.0.0.1:4000
NUXT_PUBLIC_NOINDEX=false
```

`scripts/run-static-generate.mjs` continues to set:

```text
NUXT_LEGACY_STATIC_GENERATE=true
```

The founder's parent PowerShell environment is not modified and therefore requires no manual restore step.

The verifier calculates the expected canonical URL count dynamically from the current local public inventory:

```text
2 static acquisition routes x 2 locales
+ 6 Discovery routes x 2 locales
+ every authoritative Prompt locale
+ every indexable Creator locale
```

It then asserts:

```text
sitemap canonical URL count == expected inventory count
llms canonical URL count == expected inventory count
sitemap URL set == llms URL set
robots advertises exactly https://example.test/sitemap.xml
robots does not globally Disallow: /
```

All 12 native Discovery static pages are then read from `.output/public`:

```text
6 English
6 Persian
```

Each must prove:

```text
correct lang + dir
self canonical
EN/FA hreflang
CollectionPage + ItemList JSON-LD
no staging noindex meta under production-like env
no data-public-seo-snapshot
no data-public-seo-structured
no /prompts?id=
no /user?un=
no private/protected serialized fields
```

Expected result:

```text
[phase4d-static] PASS
```

---

## 6. Rebuild rule for 4D.6

At the time 4D.6 was prepared:

```text
frontend runtime changes from 4D.5 -> already rebuilt and verified
backend runtime changes after accepted 4D.2 -> none
4D.6 changes -> scripts + package commands + docs only
```

Therefore:

```text
DO NOT run pnpm frontend again merely for 4D.6.
DO NOT run pnpm api.
DO NOT run pnpm stack.
```

The final static verifier intentionally performs its own host-side `pnpm generate`; that does not replace or mutate the running Docker frontend image.

---

## 7. Acceptance checklist

Required evidence before Phase 4D final acceptance:

```text
[ ] pnpm test:phase4d-final -> PASS
[ ] pnpm smoke:phase4d-final -> PASS
[ ] pnpm verify:phase4d-static -> PASS
[ ] prompt-draft.ir not targeted
[ ] founder explicitly accepts Phase 4D
```

If all pass, final state becomes:

```text
4D.1 -> AUDITED
4D.2 -> DONE / ACCEPTED
4D.3 -> DONE / ACCEPTED
4D.4 -> DONE / ACCEPTED
4D.5 -> DONE / ACCEPTED
4D.6 -> DONE / FOUNDER-LOCAL + EXTERNAL STAGING + STATIC VERIFIED / ACCEPTED
Phase 4D -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
```

Only then proceed to:

```text
21.5.4E — Blog V1
```
