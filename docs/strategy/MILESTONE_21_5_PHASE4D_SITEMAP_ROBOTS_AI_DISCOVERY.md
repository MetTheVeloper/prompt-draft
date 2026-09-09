# Milestone 21.5 — Phase 4D Sitemap / Robots / Discovery + AI Discovery

Status: **PLANNING / AUDIT NEXT / NOT IMPLEMENTED**

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

This file is the Phase 4D planning source of truth. It does not mark any 4D implementation slice DONE. 4D must begin with a repository/runtime audit and each implementation slice still requires founder-local verification plus explicit acceptance.

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

Known starting facts at planning time:

```text
public/robots.txt currently exists as a static compatibility file
scripts/generate-public-seo.ts still generates sitemap/robots output and contains Milestone-21-era Discovery snapshot behavior
public/llms.txt does not currently exist
4A native SSR SEO behavior is accepted
4B Public Prompt public/protected boundary is accepted
4C Public Creator server-authoritative indexability policy is accepted
```

Do not assume the exact target architecture until the audit is complete.

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

4D should converge on one reusable public URL inventory rather than independent arrays scattered across scripts.

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

For EN/FA entries, the implementation should reuse the accepted locale/canonical rules rather than infer translations from route existence alone.

The audit must decide whether the authoritative sitemap is runtime-generated, build-generated, or produced through a shared manifest consumed by both contexts. Whichever approach is selected, public eligibility logic must live in one shared contract.

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

The audit should decide whether `/llms.txt` is:

```text
static public file
build-generated output
runtime-generated response
```

Decision criteria:

```text
same authoritative inventory as sitemap
no duplicate policy logic
SSR/Docker/static-generate compatibility
staging behavior
operational simplicity
no request-time dependency on GitHub or another external service
```

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

---

## 8. Proposed execution slices

The exact slice boundaries may be refined after audit, but the default plan is:

```text
4D.1 Existing robots/sitemap/legacy SEO/runtime audit
4D.2 Shared authoritative public URL inventory + sitemap migration
4D.3 Robots normalization + staging precedence verification
4D.4 llms.txt AI-discovery projection from shared inventory
4D.5 Discovery structured-data/legacy-generator migration
4D.6 Aggregate regression + staging acceptance
```

No slice becomes DONE without founder verification and explicit acceptance.

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

Expected focused 4D contracts should cover at least:

```text
shared public inventory determinism
Prompt EN/FA sitemap eligibility
Creator indexable/discoverable sitemap eligibility
no fake localized URLs
robots/app/private boundaries
staging noindex precedence
llms.txt contains canonical public-safe resources only
llms.txt and sitemap consume the same eligibility source
no protected/private serialization
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
4D -> PLANNING / AUDIT NEXT / NOT IMPLEMENTED
```

To accept 4D, all accepted 4A–4C regressions must remain intact and the founder must explicitly accept the final 4D aggregate/staging evidence.

Only after 4D acceptance may the project proceed to:

```text
21.5.4E — Blog V1
```
