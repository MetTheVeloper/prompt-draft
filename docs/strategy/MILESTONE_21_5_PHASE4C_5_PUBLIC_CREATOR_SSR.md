# Milestone 21.5 — Phase 4C.5 Public Creator SSR

Status: **IMPLEMENTED / FOUNDER-LOCAL VERIFICATION PENDING**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Parent architecture:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_PUBLIC_CREATOR_ARCHITECTURE.md
```

Accepted backend dependency:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_4_PUBLIC_CREATOR_POLICY_API.md
```

Verification ledger:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_VERIFICATION.md
```

This slice turns the accepted 4C.4 public Creator DTO into the canonical Nuxt SSR Creator page. It does not introduce final Creator SEO metadata/JSON-LD; those remain 4C.6.

---

## 1. Canonical routes

Implemented Nuxt page:

```text
app/pages/creator/[username].vue
```

Locale routes:

```text
/creator/:username
/fa/creator/:username
```

The route is username-keyed and consumes only:

```text
GET /api/public/creators/:username
```

No authenticated owner/admin profile contract is used.

---

## 2. SSR loading and error semantics

New composable:

```text
app/composables/usePublicCreator.ts
```

Responsibilities:

```text
server fetch -> runtimeConfig.apiBaseInternal
browser fetch -> runtimeConfig.public.apiBase
positive browser/SSR DTO normalization
canonical username assertion
safe HTTP/HTTPS URL validation
localized skill/publication contract validation
extra/private fields ignored by positive projection
```

The page performs SSR data loading with:

```text
await useAsyncData(...)
```

Error behavior:

```text
public API 404 -> real Nuxt 404
invalid username -> real Nuxt 404
unexpected public API failure -> 502 temporary-unavailable error
```

The page does not convert unavailable Creator states into a client-only empty shell.

---

## 3. Canonical username redirect

Public route canonicalization uses the shared project username rule:

```text
trim().toLowerCase()
^[a-z0-9._-]{3,64}$
```

Mixed-case/noncanonical route forms redirect to the locale-preserving canonical Creator path with:

```text
301
```

Example:

```text
/creator/GrassiaS -> /creator/grassias
/fa/creator/GrassiaS -> /fa/creator/grassias
```

Historical approved-Creator rename aliases are intentionally not activated here because approved/suspended Creator username mutation remains backend-blocked until alias/history support exists.

Therefore the safety strategy remains:

```text
approved Creator rename locked
-> no historical canonical break can currently be created
-> creator_username_aliases + permanent historical redirects must land before that lock is relaxed
```

This preserves the architecture precondition without inventing aliases that do not exist yet.

---

## 4. Public Creator presentation

The SSR page presents only accepted public fields:

```text
localized ScreenName
@username
localized Bio
avatar
cover
safe public location text
active localized Skills
safe public Links
localized long-form Creator article
canonical public Prompt publication summaries
```

No owner/admin controls are rendered by the route.

The page does not use:

```text
useAuth
useProfileManagement
/manage/profile
/manage/users
Creator request endpoint
admin Creator review endpoints
```

Global application chrome may still reflect the viewer's authenticated state; the Creator page content itself remains public-only.

---

## 5. EN/FA and LTR/RTL behavior

Creator identity requires EN + FA content at approval time, while the 4C.4 API also degrades defensively for corrupted/legacy incomplete data.

Page locale projection:

```text
EN -> identity.*.en
FA -> identity.*.fa
```

The page root explicitly projects:

```text
dir=ltr for EN
dir=rtl for FA
```

Skills use localized taxonomy labels.

Creator publication cards are shown only when that publication advertises the active locale through `availableLocales`; the Creator page does not invent cross-locale Prompt fallback content.

Publication links use the canonical localized Public Prompt route:

```text
/prompt/:id
/fa/prompt/:id
```

---

## 6. Sanitized Markdown pipeline

New pure utility:

```text
app/utils/publicCreatorMarkdown.ts
```

The public Creator article is stored/transmitted as Markdown source and rendered through this constrained renderer before `v-html`.

Supported V1 presentation subset includes:

```text
headings
paragraphs
strong/emphasis
inline code
fenced code
unordered/ordered lists
blockquotes
horizontal rules
HTTP/HTTPS or root-relative links
HTTP/HTTPS or root-relative images
```

Security contract:

```text
raw HTML is escaped
javascript: links rejected
data: images rejected
only HTTP/HTTPS and safe root-relative URLs are rendered
external links receive rel="ugc noopener noreferrer"
external links open in a new tab
Markdown # heading is rendered below the page H1 hierarchy
```

The page binds only:

```text
v-html="articleHtml"
```

where `articleHtml` is produced by `renderPublicCreatorMarkdown(...)`.

Raw article source is never bound directly to `v-html`.

---

## 7. Responsive personal-brand layout

Implemented presentation includes:

```text
cover hero with safe fallback art
avatar overlap identity card
localized public identity and Bio
public links
skills panel
Creator article panel
public identity facts panel
responsive publication card grid
zero-publication empty state
mobile single-column adaptation
```

The approved zero-publication Creator remains a valid page; the Publications section renders an intentional empty state rather than treating the Creator as unavailable.

---

## 8. Localization

Added:

```text
i18n/locales/public-creator.en.ts
i18n/locales/public-creator.fa.ts
```

Registered in:

```text
i18n/i18n.config.ts
```

Visible page labels are localized in EN/FA.

---

## 9. Contract tests

Added frontend-focused verification:

```text
scripts/public-creator-client-contract.test.ts
scripts/public-creator-markdown.test.ts
scripts/public-creator-ssr-contract.test.ts
```

Command:

```text
pnpm test:public-creator-web
```

Coverage includes:

```text
positive Creator browser/SSR allowlist normalization
private sentinel stripping
safe defensive noindex Creator normalization
noncanonical username rejection
unsafe public link rejection
publication localization consistency
supported Markdown rendering
raw HTML escaping
javascript:/data: rejection
fenced-code escaping
SSR public API dependency
real 404/502 contract
301 canonical redirect contract
sanitized-only v-html binding
LTR/RTL projection
localized Public Prompt publication links
absence of owner/admin management hooks
```

---

## 10. 4C.6 boundary

4C.5 deliberately does **not** complete final Creator SEO.

Still reserved for 4C.6:

```text
localized title/meta/OG/Twitter projection
self canonical
reciprocal hreflang
x-default
policy-driven robots
ProfilePage + Person JSON-LD
staging global noindex proof
```

This keeps SSR/presentation and SEO acceptance independently verifiable.

---

## 11. Founder-local verification gate

Focused automated verification:

```powershell
git pull
pnpm test:public-creator-web
pnpm locale:check
pnpm frontend
```

Backend regression is already accepted in 4C.4, but before 4C.5 acceptance a cheap focused regression is recommended:

```powershell
docker compose exec api npm run test:public-creator
```

Manual browser smoke with approved staging Creator `grassias`:

```text
[ ] /creator/grassias returns the Creator page
[ ] /fa/creator/grassias returns the Persian Creator page
[ ] English uses LTR and English ScreenName/Bio/Article
[ ] Persian uses RTL and Persian ScreenName/Bio/Article
[ ] current zero-publication Creator shows a valid empty Publications state
[ ] skills render localized
[ ] public website link works
[ ] location text renders, with no provider metadata
[ ] article headings/bold/link/image render correctly
[ ] raw Markdown syntax is not shown for supported constructs
[ ] mixed-case /creator/GrassiaS permanently redirects to /creator/grassias
[ ] mixed-case /fa/creator/GrassiaS permanently redirects to /fa/creator/grassias
[ ] pending/rejected/suspended/non-Creator username produces a real 404
[ ] page contains no Edit Profile / Request Creator / admin review controls
```

Because final SEO belongs to 4C.6, do not use missing Creator-specific canonical/hreflang/JSON-LD as a 4C.5 failure.

---

## 12. Acceptance rule

Until founder-local automated verification, browser smoke, and explicit founder acceptance:

```text
4C.5 -> IMPLEMENTED / FOUNDER-LOCAL VERIFICATION PENDING
```
