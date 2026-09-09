# Milestone 21.5 — Phase 4D Sitemap / Robots / Discovery + AI Discovery

Status: **IN PROGRESS / 4D.1 AUDITED / 4D.2 DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED / 4D.3 AUDIT NEXT**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Parent source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
```

Accepted dependencies:

```text
21.5.4A SEO Contracts & Route Semantics                  ACCEPTED
21.5.4B Public Prompt Architecture                       ACCEPTED
21.5.4C Public Creator Architecture + Indexability       ACCEPTED
```

Operational verification rule:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

This file is the Phase 4D source of truth. It does not mark any 4D implementation slice DONE without founder-local/staging verification plus explicit acceptance.

---

## 1. Objective

Phase 4D consolidates search-engine and AI-oriented public discovery around one authoritative public URL/indexability contract.

The target is:

```text
one canonical public inventory
-> sitemap.xml
-> robots behavior
-> Discovery SEO/structured-data integration
-> llms.txt supplemental AI-discovery projection
```

4D must not create parallel definitions of:

```text
Prompt visibility
Prompt locale availability
Creator accessibility
Creator indexability/discoverability
public/private route boundaries
```

The accepted 4A–4C policies remain authoritative.

---

## 2. Mandatory audit scope before implementation

Read and inspect the current authoritative branch before deciding implementation shape.

Audit at least:

```text
public/robots.txt
public/llms.txt if one exists
scripts/generate-public-seo.ts
current sitemap.xml generation/output
Nuxt routeRules
server X-Robots-Tag behavior
NUXT_PUBLIC_NOINDEX handling
app/composables/usePublicSeo.ts
Public Prompt public DTO + availableLocales contract
Public Creator policy.indexable/discoverable
Discovery API/projection/SEO/structured-data behavior
static generate / pnpm generate compatibility
legacy post-generate HTML/sitemap/robots patching
```

Audit result on 2026-09-09:

```text
public/robots.txt remains a static compatibility file
public/llms.txt does not exist
scripts/generate-public-seo.ts was the sitemap/robots post-generate writer
legacy Discovery snapshot behavior still contains /prompts?id= and /user?un= links
Nuxt/runtime noindex and X-Robots behavior remain separate accepted protection layers
Public Prompt availableLocales is derived from complete localized title + description
Public Creator indexable/discoverable is server-authoritative under the accepted 4C policy
Creator inventory cannot be inferred from Prompt ownership/publication count
pnpm generate remains a legacy static-generation compatibility path
```

4D.1 audit has been performed. Its findings are the implementation basis for the accepted 4D.2 slice and the upcoming 4D.3 audit.

---

## 3. Locked public/indexability inputs inherited from 4A–4C

### Locale model

```text
English/default -> unprefixed
Persian         -> /fa
```

Only authoritative localized content may create an indexable localized URL.

No fake fallback localization may be put into sitemap, structured discovery, or AI-discovery output.

### Public Prompt

Canonical routes:

```text
/prompt/:id
/fa/prompt/:id
```

Eligibility must continue to come from the accepted public Prompt contract:

```text
published-only public item
authoritative localized title + description for each advertised locale
public numeric id
sanitized public presentation fields only
```

Never expose through 4D:

```text
protected Prompt body
variants
unlock state
private Draft payload
source Draft id
source user UUID
storage keys
balance/Goin
permissions/viewer/account state
```

### Public Creator

Canonical routes:

```text
/creator/:username
/fa/creator/:username
```

Creator policy remains:

```text
accessible = active account + approved Creator + canonical username
indexable = accessible + complete Creator profile
discoverable = indexable
```

4D must consume this result. It must not reproduce Creator eligibility with SQL heuristics, publication counts, roles, or profile scoring.

### Discovery

Discovery remains a sanitized public acquisition surface. 4D may improve truthful structured-data/SEO integration and sitemap participation, but must preserve real 404/canonical behavior and the accepted Creator attribution policy.

---

## 4. Sitemap target contract

4D converges on one reusable public URL inventory rather than independent arrays scattered across scripts.

Target categories:

```text
static acquisition routes
Discovery canonical routes
Public Prompt canonical routes for authoritative locales
eligible Public Creator canonical routes for authoritative locales
future published Blog routes only after 4E exists
```

Important:

```text
Blog is not a current 4D live inventory source.
```

The sitemap must not invent Blog URLs before 4E establishes published Article semantics.

For EN/FA entries, the implementation reuses the accepted locale/canonical rules rather than inferring translations from route existence alone.

### 4.1 Selected implementation shape after audit

The selected 4D architecture is build-generated projection from a shared inventory contract:

```text
accepted server-authoritative Prompt/Creator inputs
+ static acquisition/Discovery inputs
-> shared public URL inventory builder
-> sitemap.xml projection
-> later llms.txt projection
```

Dynamic public eligibility is supplied by a narrow public API projection:

```text
GET /api/public/inventory
```

Its public response intentionally contains only URL-inventory inputs:

```text
Prompt: public numeric id + authoritative availableLocales
Creator: canonical username + availableLocales + policy.indexable/discoverable
```

It does not serialize protected Prompt data, internal ids, account/lifecycle metadata, balances, permissions, sessions, storage/provider data, or admin data.

Creator enumeration consumes the accepted 4C policy evaluator. It does not use Prompt publication count, role, or ownership as an eligibility gate.

`NUXT_PUBLIC_NOINDEX=true` is an outer build-time inventory gate: shared public URL projections become empty rather than advertising staging URLs.

---

## 5. Robots target contract

`robots.txt` remains the crawler-access-control surface.

4D must audit and normalize:

```text
public crawling intent
application/private route exclusions
sitemap declaration
locale-space consistency
interaction with server X-Robots-Tag
interaction with NUXT_PUBLIC_NOINDEX staging protection
```

Rules:

```text
robots.txt must never be used as a replacement for backend authorization
application/private X-Robots-Tag behavior remains intact
NUXT_PUBLIC_NOINDEX=true always wins on staging
route-level index intent may never weaken staging noindex
```

AI-crawler-specific directives, if considered during audit, must be explicit product decisions. They must not be silently inferred from the presence of `llms.txt`.

---

## 6. AI discovery — llms.txt

Phase 4D explicitly includes an evaluation and implementation of:

```text
/llms.txt
```

when the audit confirms a clean integration path.

### 6.1 What llms.txt means for Prompt Draft

For this project, `llms.txt` is treated as an **optional / experimental supplemental AI-discovery convention**: a concise, LLM-friendly orientation to the site's canonical public resources.

It is not treated as:

```text
a crawler permission system
a robots.txt replacement
a sitemap replacement
a training opt-in or opt-out mechanism
a guarantee that any AI model will index or cite the site
an independent source of truth for indexability
```

Crawler access remains a `robots.txt` concern. Search URL discovery remains a sitemap/public-indexability concern. `llms.txt` only provides a curated machine-friendly guide to already-public canonical resources.

### 6.2 llms.txt source-of-truth rule

`llms.txt` must consume the same public canonical/indexable inventory used by sitemap/public route policy.

Forbidden architecture:

```text
sitemap eligibility logic A
+ llms.txt eligibility logic B
```

Required architecture:

```text
shared public inventory/policy
-> sitemap projection
-> llms.txt projection
```

This is especially important for:

```text
Prompt locale availability
Creator policy.indexable/discoverable
Creator canonical username
Discovery canonical slugs
future Blog publication/localization state
```

### 6.3 Candidate llms.txt content

Initial candidate resource families:

```text
/
/guide
/discover/:slug
/prompt/:id
/creator/:username
```

Future after 4E only:

```text
/blog
/blog/:slug
```

The final file should be concise and curated rather than dumping every internal route or account/product URL without context.

Audit decision:

```text
/llms.txt -> build-generated in 4D.4 from the same shared public URL inventory as sitemap.xml
```

This avoids a hand-maintained second policy and avoids request-time dependencies on GitHub or another external service.

An optional fuller machine-readable/Markdown companion such as `llms-full.txt` may be evaluated later, but it is not required for 4D V1 and must not expand scope unless justified.

### 6.4 AI-discovery privacy boundary

`llms.txt` must never contain or link models toward intentionally protected/private data such as:

```text
protected Prompt bodies or variants
private Drafts
/manage or authenticated account surfaces
email
birthday
role/account status
Creator lifecycle/review metadata
internal UUIDs/source_user_id/source_draft_id
XP/Goin/balance
permissions/sessions/referrals
storage keys
location provider metadata
admin audit data
```

Public Prompt and Creator links must point only to canonical acquisition routes.

### 6.5 Staging rule

`grassic.ir` remains staging and `NUXT_PUBLIC_NOINDEX=true` remains authoritative.

Adding `llms.txt` must not be interpreted as overriding staging noindex or as permission to promote staging URLs to a production AI/search inventory.

`prompt-draft.ir` must remain untouched until an explicit production rollout phase.

---

## 7. Discovery migration target

4D should audit the Milestone-21 legacy `generate-public-seo.ts` Discovery snapshot behavior against the accepted native Nuxt SSR path.

Target direction:

```text
native SSR metadata remains authoritative
truthful Discovery structured data uses sanitized public data
canonical Public Prompt links remain /prompt/:id
canonical Creator links remain /creator/:username
shared public URL inventory feeds sitemap/AI discovery
legacy static SEO patching is reduced incrementally, not deleted blindly
```

Any legacy retirement must be regression-safe for:

```text
pnpm generate
production Nuxt/Nitro build
Docker staging runtime
SEO metadata
sitemap
robots
Discovery presentation
```

Current 4D.2 intentionally leaves the legacy Discovery snapshot/rendering behavior in place. Canonical-link and structured-data migration remains scoped to 4D.5 so the inventory/sitemap slice can be verified narrowly.

---

## 8. Execution slices

Current boundaries:

```text
4D.1 Existing robots/sitemap/legacy SEO/runtime audit
     AUDITED

4D.2 Shared authoritative public URL inventory + sitemap migration
     DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09

4D.3 Robots normalization + staging precedence verification
     AUDIT NEXT

4D.4 llms.txt AI-discovery projection from shared inventory
     NOT STARTED

4D.5 Discovery structured-data/legacy-generator migration
     NOT STARTED

4D.6 Aggregate regression + staging acceptance
     NOT STARTED
```

No slice becomes DONE without founder verification and explicit acceptance.

### 8.1 4D.2 implementation checkpoint — 2026-09-09

Implemented files/contracts:

```text
backend/src/publicLocalization.mjs
  shared Public Prompt authoritative-locale normalization

backend/src/publicInventory.mjs
  sanitized GET /api/public/inventory projection
  Prompt published/public-id/locale inputs only
  Creator policy reuse from accepted 4C evaluator

backend/src/publicPrompt.mjs
  reuses shared localization contract
  routes the public inventory endpoint through the existing public API surface

scripts/public-url-inventory.ts
  shared canonical URL builder
  static + Discovery + Prompt + Creator resource families
  EN unprefixed / FA-prefixed canonical projection
  global noindex outer gate
  sitemap formatter

scripts/generate-public-seo.ts
  sitemap migrated away from STATIC_PUBLIC_ROUTES
  fetches authoritative dynamic inventory when indexing is enabled
  fails rather than silently publishing a partial dynamic sitemap on invalid inventory response
  keeps legacy Discovery snapshot behavior for 4D.5

scripts/run-static-generate.mjs
  Windows-safe pnpm invocation for founder-local static generation

package.json
  restores @vueuse/core as the direct runtime dependency already represented in pnpm-lock.yaml

focused contract tests
  backend/src/publicInventory.test.mjs
  scripts/public-url-inventory.test.ts
  scripts/public-seo-generator-contract.test.ts
```

No `llms.txt` implementation is included in 4D.2. 4D.4 must consume this same shared inventory rather than introducing another eligibility list.

### 8.2 4D.2 founder-local verification evidence — ACCEPTED 2026-09-09

Focused contract gates:

```text
pnpm test:public-url-inventory
-> 7 tests / 7 pass / 0 fail

pnpm api
-> API image rebuilt successfully

pnpm test:public-inventory-api
-> 16 tests / 16 pass / 0 fail
```

Runtime inventory evidence:

```text
GET http://127.0.0.1:4000/api/public/inventory
-> ok = true
-> prompts = 101
-> creators = 1
-> protected-field privacy scan = no matches
```

Static-generation compatibility:

```text
NUXT_PUBLIC_SITE_URL=https://example.test
NUXT_PUBLIC_API_BASE=http://127.0.0.1:4000
NUXT_PUBLIC_NOINDEX=false
pnpm generate
-> PASS
-> Discovery enrichment 6/6
-> sitemap generated for 220 canonical public routes
```

Expected route-count proof:

```text
101 Prompt x 2 locales = 202
1 Creator x 2 locales  =   2
2 static x 2 locales   =   4
6 Discovery x 2 locales=  12
TOTAL                   = 220
```

Generated-artifact inspection:

```text
sitemap <url> count = 220
canonical /prompt/:id present
canonical /fa/prompt/:id present
canonical /creator/:username present
canonical /fa/creator/:username present
Discovery EN/FA routes present
legacy /prompts?id= entries in sitemap = 0
legacy /user?un= entries in sitemap = 0
generated robots includes Sitemap: https://example.test/sitemap.xml
```

The founder explicitly accepted 4D.2 after this evidence on 2026-09-09.

---

## 9. Verification discipline

Before proposing test/rebuild commands, read:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

That file exists specifically to keep local verification fast. Follow its rules:

```text
inspect changed files first
use no rebuild when possible
otherwise rebuild only the affected service
prefer root package.json pnpm scripts
never default to pnpm stack
run narrow slice tests before broad aggregate tests
```

Focused 4D contracts cover at least:

```text
shared public inventory determinism
Prompt EN/FA sitemap eligibility
Creator indexable/discoverable sitemap eligibility
no fake localized URLs
staging/global noindex inventory precedence
no protected/private serialization
sitemap consumes the shared eligibility source
```

Remaining later-slice contracts:

```text
robots/app/private boundaries
llms.txt contains canonical public-safe resources only
llms.txt and sitemap consume the same eligibility source
Discovery canonical/public links remain correct
legacy generator compatibility or intentional retirement path
```

Final staging acceptance must prove `/sitemap.xml`, `/robots.txt`, `/llms.txt`, representative Prompt/Creator/Discovery routes and staging noindex behavior without targeting `prompt-draft.ir`.

---

## 10. Non-negotiable safety boundaries

```text
DO NOT weaken backend authorization for SEO or AI discovery.
DO NOT expose GET /api/archive/:id publicly.
DO NOT expose protected Prompt bodies/variants.
DO NOT expose private Drafts.
DO NOT expose private Creator/account fields.
DO NOT infer Creator from users.role or Prompt ownership.
DO NOT create a second Creator indexability definition.
DO NOT create fake locale sitemap/llms entries.
DO NOT let llms.txt override robots/indexability policy.
DO NOT let route-level SEO override NUXT_PUBLIC_NOINDEX=true.
DO NOT query GitHub or another external service per public request merely to build llms/sitemap data.
DO NOT touch prompt-draft.ir during 4D staging implementation/verification.
```

---

## 11. Acceptance rule

Current state:

```text
4D -> IN PROGRESS
4D.1 -> AUDITED
4D.2 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
4D.3 -> AUDIT NEXT
```

To accept 4D, all accepted 4A–4C regressions must remain intact and the founder must explicitly accept the final 4D aggregate/staging evidence.

Only after 4D acceptance may the project proceed to:

```text
21.5.4E — Blog V1
```
