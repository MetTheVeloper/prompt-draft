# Milestone 21.5 — Phase 4D.6 Aggregate Regression + Staging Acceptance

Status: **DONE / FOUNDER-LOCAL + EXTERNAL STAGING + STATIC VERIFIED / ACCEPTED 2026-09-09**

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
4D.5 native Discovery structured data + legacy retirement  ACCEPTED
```

---

## 1. Final decision

Phase 4D.6 is accepted.

The founder supplied and accepted all three required final gates:

```text
A. pnpm test:phase4d-final
B. pnpm smoke:phase4d-final
C. pnpm verify:phase4d-static
```

All passed on 2026-09-09.

Therefore:

```text
4D.6   -> DONE / FOUNDER-LOCAL + EXTERNAL STAGING + STATIC VERIFIED / ACCEPTED
Phase 4D -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
```

The next roadmap slice is:

```text
21.5.4E — Blog V1
```

---

## 2. Gate A — aggregate Phase 4D regression

Command:

```powershell
pnpm test:phase4d-final
```

Result:

```text
PASS
```

The aggregate gate first reran the accepted 4A–4C baseline and then the 4D contracts.

Accepted baseline evidence remained green across:

```text
Creator profile foundation
Creator skill taxonomy
Authenticated profile management
Creator application/admin review
Generated username contract
Public Creator policy/API
Prompt/Discovery Creator attribution
Public Creator SSR/SEO/browser contract
Creator attribution browser contract
Phase 4B public/protected regression
strict locale-routing audit
runtime localization contract
```

Phase 4D focused gates then passed:

```text
public URL inventory + sitemap      7/7 PASS
robots/runtime delivery             7/7 PASS
llms/runtime delivery               9/9 PASS
native Discovery SEO migration      8/8 PASS
```

Aggregate conclusion:

```text
accepted 4A–4C routing/privacy/public-projection behavior remained intact
one shared canonical public inventory remained authoritative
robots/runtime behavior remained shared and staging-safe
llms.txt remained a projection of the same public inventory
native Discovery SSR remained authoritative
legacy Discovery SEO renderer remained retired
```

---

## 3. Gate B — real external Cloudflare staging smoke

Command:

```powershell
pnpm smoke:phase4d-final
```

Targets:

```text
https://grassic.ir
https://api.grassic.ir
```

Safety rule:

```text
prompt-draft.ir was not targeted
```

Final result:

```text
PASS
```

Observed representative inventory:

```text
Public Prompt: 6
Public Creator: grassias
```

Verified external responses:

```text
GET /api/public/inventory                    -> 200
GET /api/archive/6 unauthenticated           -> 401
GET https://grassic.ir/robots.txt            -> 200
GET https://grassic.ir/sitemap.xml           -> 200
GET https://grassic.ir/llms.txt               -> 200
GET /prompt/6                                 -> 200
GET /creator/grassias                         -> 200
GET /discover/portrait-photography            -> 200
GET /fa/prompt/6                              -> 200
GET /fa/creator/grassias                      -> 200
GET /fa/discover/portrait-photography         -> 200
```

Verified public/security behavior:

```text
public inventory exposes only URL-inventory-safe fields
protected Archive detail remains unauthorized to anonymous users
staging X-Robots-Tag noindex remains active
sitemap publishes zero URLs under global staging noindex
llms.txt publishes zero canonical links under global staging noindex
EN/FA public Prompt/Creator/Discovery SSR remains reachable and correctly localized
canonical/hreflang/x-default remain correct
Prompt/Creator/Discovery structured data remains public-safe
private/protected serialized fields remain absent
legacy Discovery detail links remain absent from acquisition/SEO projections
```

### 3.1 Cloudflare Managed robots.txt nuance

The external edge currently prepends Cloudflare Managed robots content before the origin robots policy.

Observed managed block includes crawler-specific policy such as:

```text
Content-Signal: search=yes,ai-train=no,use=reference
```

and crawler-specific `Disallow: /` rules for selected bots.

This is an edge-managed policy separate from Prompt Draft's origin robots renderer.

The final smoke was corrected to validate Prompt Draft's origin `User-agent: *` stanza independently rather than incorrectly treating crawler-specific Cloudflare stanzas as a global site block.

Origin staging robots policy still proves:

```text
User-agent: *
Allow: /
no global Disallow: /
all accepted EN + FA application/private exclusions
no Sitemap declaration while NUXT_PUBLIC_NOINDEX=true
```

### 3.2 Protected Prompt CTA nuance

The accepted 4B contract deliberately keeps the Public Prompt page's product CTA pointed at the protected product route:

```text
/prompts?id=<id>
/fa/prompts?id=<id>
```

That route is allowed as an intentional user action from the Public Prompt page.

It remains forbidden as a canonical acquisition/detail URL in:

```text
Discovery acquisition links
Home acquisition links
sitemap.xml
llms.txt
Discovery structured data
Public Prompt structured data
```

The final smoke was corrected accordingly and then passed.

---

## 4. Gate C — production-like static compatibility

Command:

```powershell
pnpm verify:phase4d-static
```

Result:

```text
PASS
```

The verifier ran one isolated production-like static generation with:

```text
NUXT_PUBLIC_SITE_URL=https://example.test
NUXT_PUBLIC_API_BASE=http://127.0.0.1:4000
NUXT_API_BASE_INTERNAL=http://127.0.0.1:4000
NUXT_PUBLIC_NOINDEX=false
NUXT_LEGACY_STATIC_GENERATE=true
```

The parent PowerShell environment was not modified.

Current public inventory produced an expected canonical URL count of:

```text
220
```

Generation evidence:

```text
Nuxt static build PASS
331 routes prerendered
.output/public generated
public-seo generator completed
legacy Discovery artifacts cleaned: 0
```

Crawler-artifact parity:

```text
sitemap URLs: 220
llms URLs:    220
sitemap URL set == llms URL set
robots advertises https://example.test/sitemap.xml
```

Native Discovery static verification:

```text
6 English Discovery routes
6 Persian Discovery routes
12 native Discovery HTML pages checked
```

Each checked route proved:

```text
correct lang + dir
self canonical
EN/FA hreflang
native CollectionPage + ItemList JSON-LD
no staging noindex under indexing-enabled environment
no data-public-seo-snapshot marker
no data-public-seo-structured marker
no legacy /prompts?id= Discovery detail links
no legacy /user?un= Creator detail links
no protected/private serialized fields
```

Known Nuxt/Vite warnings seen during generation were non-blocking and pre-existing, including duplicate auto-import names and large client chunks. They did not fail build or verification.

---

## 5. Final accepted Phase 4D architecture

```text
server-authoritative Prompt/Creator public eligibility
        |
        v
GET /api/public/inventory
        |
        v
one shared canonical public URL inventory
        |
        +--> sitemap.xml
        +--> llms.txt
        +--> legacy-static compatibility projection

shared application SEO route policy
        +--> Nuxt application/client-only route policy
        +--> X-Robots-Tag middleware
        +--> origin robots exclusions

native Nuxt Discovery SSR
        +--> visible public content
        +--> usePublicSeo metadata
        +--> CollectionPage / ItemList JSON-LD
```

Accepted resource families before Blog V1:

```text
/
/guide
/discover/:slug
/prompt/:id
/creator/:username
```

Locale model:

```text
English/default -> unprefixed
Persian         -> /fa
```

Only authoritative localized content is advertised.

---

## 6. Final staging contract

`grassic.ir` remains staging.

```text
NUXT_PUBLIC_NOINDEX=true always wins
```

Therefore on staging:

```text
public pages remain fetchable for verification
response/meta noindex remains authoritative
origin robots keeps application/private exclusions
origin robots omits Sitemap
runtime sitemap exposes zero public URLs
runtime llms.txt exposes zero canonical resource links
```

Cloudflare may additionally prepend its own managed crawler/content-signal policy at the edge.

That edge policy is separate from the application indexability source of truth.

---

## 7. Non-negotiable boundaries inherited into 4E

```text
DO NOT weaken backend authorization for SEO/public content.
DO NOT expose GET /api/archive/:id publicly.
DO NOT expose protected Prompt bodies or variants.
DO NOT expose private Drafts.
DO NOT expose private Creator/account fields.
DO NOT recreate Creator eligibility independently.
DO NOT advertise fake localized URLs.
DO NOT let route-level SEO override NUXT_PUBLIC_NOINDEX=true.
DO NOT treat llms.txt as crawler permission or training consent.
DO NOT query GitHub per public request.
DO NOT touch prompt-draft.ir until an explicit rollout phase.
```

---

## 8. Acceptance checklist — FINAL

```text
[x] pnpm test:phase4d-final -> PASS
[x] pnpm smoke:phase4d-final -> PASS
[x] pnpm verify:phase4d-static -> PASS
[x] prompt-draft.ir not targeted
[x] founder authorized closure and progression to Blog V1
```

Final state:

```text
4D.1 -> AUDITED
4D.2 -> DONE / ACCEPTED
4D.3 -> DONE / ACCEPTED
4D.4 -> DONE / ACCEPTED
4D.5 -> DONE / ACCEPTED
4D.6 -> DONE / FOUNDER-LOCAL + EXTERNAL STAGING + STATIC VERIFIED / ACCEPTED
Phase 4D -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED 2026-09-09
```

Next:

```text
21.5.4E — Blog V1
```
