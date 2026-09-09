# Milestone 21.5 — Phase 4E Blog V1

Status: **PLANNING / AUDIT STARTED / IMPLEMENTATION NOT STARTED**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Parent source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
```

Accepted dependency:

```text
21.5.4D Sitemap / Robots / Discovery + AI Discovery
DONE / FOUNDER-LOCAL + EXTERNAL STAGING + STATIC VERIFIED / ACCEPTED 2026-09-09
```

Operational workflow:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

---

## 1. Objective

4E adds a real repository-backed bilingual Blog acquisition system to Prompt Draft without creating a second SEO/indexability/content-source architecture.

Target public routes:

```text
/blog
/blog/:slug
/fa/blog
/fa/blog/:slug
```

Blog must be:

```text
SSR-first
repository-backed
EN/FA authoritative-localization aware
safe Markdown
SEO/structured-data complete
integrated with the accepted shared sitemap/llms inventory
manageable through /manage/blog
media-compatible with the existing Arvan pipeline
compatible with Docker/Nitro and legacy pnpm generate
```

---

## 2. Locked inherited contracts

### Locale model

```text
English/default -> unprefixed
Persian         -> /fa
```

Only authoritative localized Article content may create a localized public/indexable route.

No fallback-only `/fa/blog/...` page may pretend to be authoritative Persian content.

### Staging

```text
NUXT_PUBLIC_NOINDEX=true always wins on grassic.ir
```

Blog route-level SEO may never weaken staging noindex.

### Shared public inventory

4D is authoritative for sitemap/llms projection.

Blog must join that shared pipeline; it must not create:

```text
Blog sitemap logic A
Blog llms logic B
Blog page indexability logic C
```

Required direction:

```text
one published Article/localization policy
-> Blog route availability
-> shared public inventory
-> sitemap.xml
-> llms.txt
```

### Security

Blog work must not expose:

```text
protected Prompt bodies/variants
private Drafts
private account/Creator data
internal source ids
permissions/sessions/economy state
storage secrets
admin-only editorial state
```

---

## 3. Accepted editorial-source architecture

Canonical editorial source:

```text
Git repository
```

Normal public serving:

```text
repository content
-> build/deploy
-> bundled/deployed Nuxt/Nitro Blog content
-> request-time SSR
```

GitHub is never queried per public Blog request.

Arvan Object Storage role:

```text
Blog media
mirror/emergency publication store
```

Arvan is not a second uncontrolled equal editorial source of truth.

If emergency publication is implemented, it must carry explicit reconciliation metadata such as:

```text
articleId
revision/contentHash
publishedAt
source=emergency
syncState=pending_git
```

---

## 4. Audit findings so far

### 4.1 Existing public/Manage route surface

Current branch has no `app/pages/blog` route and no `/manage/blog` page yet.

Current Manage pages are:

```text
/manage/archive
/manage/dashboard
/manage/economy
/manage/growth
/manage/profile
/manage/users
```

### 4.2 Manage permission model

Manage sections are explicit permission-driven configuration.

Current backend/frontend permissions include:

```text
dashboard.view
system.metrics.view
users.view
users.manage
creators.manage
drafts.view_all
drafts.delete_any
system.settings.manage
collage.view
archive.view
archive.manage
```

There is currently no Blog/content-specific permission.

Selected direction:

```text
add an explicit Blog management permission
```

Do not reuse an unrelated Archive/System permission just to expose `/manage/blog`.

Exact V1 naming is finalized during 4E.1, likely a capability in the family of:

```text
blog.manage
```

### 4.3 Existing Arvan/media capability

The current Archive media backend already provides reusable storage primitives around:

```text
Arvan/AWS-SigV4 request signing
stable public URL construction
PUT/DELETE object operations
public immutable cache headers
full + thumbnail image handling
validation
cleanup on failure
```

The existing Archive endpoint itself is Archive-specific and currently receives base64 image JSON.

Blog must not put base64 payloads in Markdown.

Selected direction:

```text
reuse/extract generic storage/signing primitives
-> Blog-specific media upload contract
-> stable public URL/reference inserted into Markdown
```

### 4.4 Markdown editor candidate

Current implementation candidate:

```text
md-editor-v3
```

Audit snapshot on 2026-09-09:

```text
latest npm version: 6.5.6
license: MIT
Vue 3 + TypeScript
supports editor + preview-only rendering
supports custom onUploadImg callback
```

Dependency selection is not considered accepted until bundle/SSR/client integration is tested in the project.

Public Blog rendering must not rely on the editor component itself; public rendering needs a server-safe deterministic Markdown pipeline.

---

## 5. Proposed repository Article contract

4E.1 will audit/lock the exact representation before public implementation.

Preferred direction:

```text
content/blog/<articleId>/
  article.json
  en.md
  fa.md
```

Rationale:

```text
stable article identity is independent from slug
shared metadata is not duplicated in locale frontmatter
Markdown body stays clean and portable
EN/FA bodies are explicit authoritative files
slug may change without moving the stable article directory
validation is straightforward
```

Conceptual `article.json`:

```text
id
slug
status
publishedAt
updatedAt
author
hero
localizations
  en
    title
    description
  fa
    title
    description
```

Body:

```text
en.md
fa.md
```

This exact shape remains a proposal until the 4E.1 contract audit is completed.

---

## 6. Publication / localization semantics to lock in 4E.1

Candidate lifecycle:

```text
draft
published
```

V1 may add scheduled/archive states only if current product need justifies them.

Public Article route eligibility should require at least:

```text
status = published
valid stable article id
valid canonical slug
publishedAt
safe public author projection
authoritative locale title
authoritative locale description
non-empty authoritative locale body
```

A published Article may expose only EN, only FA, or both if the product chooses to permit partial localization.

Whichever rule is selected must be the one source for:

```text
route 404/availability
hreflang
Blog index
sitemap
llms
structured data
```

No fake locale fallback.

---

## 7. Public Blog V1 target

### Blog index

```text
/blog
/fa/blog
```

V1 should provide:

```text
SSR list of published Articles available in the active locale
localized title + description
hero/cover when available
published date
updated date when meaningful
author display when authoritative
canonical localized article links
```

Sorting default:

```text
publishedAt descending
```

Pagination/categories/tags are intentionally audited before adding scope. V1 should avoid building a taxonomy system merely because a Blog exists.

### Article detail

```text
/blog/:slug
/fa/blog/:slug
```

Must provide:

```text
SSR meaningful article HTML
safe Markdown rendering
localized title/description/body
self canonical
reciprocal hreflang only for authoritative localizations
x-default -> English when authoritative
OG/Twitter metadata
hero image when available
publishedAt / updatedAt
Article or BlogPosting JSON-LD
real 404
canonical slug behavior
internal links/CTA opportunities
staging global noindex precedence
```

---

## 8. Public Markdown safety

Public Blog HTML must not blindly trust Markdown HTML.

4E.1/4E.2 must choose one deterministic Markdown rendering/sanitization contract covering at least:

```text
headings
paragraphs
bold/italic
ordered/unordered lists
blockquote
links
images
inline/fenced code
horizontal rules
safe tables if enabled
```

Rules:

```text
raw HTML must be escaped or sanitized under an explicit policy
javascript:/data: unsafe links must be rejected
unsafe image protocols must be rejected
script/event-handler injection must not survive
server and client rendering must agree
```

The public renderer should be reusable independently of `/manage/blog` and `md-editor-v3`.

---

## 9. Blog author model

4E must explicitly choose whether Article authors are:

```text
editorial/site identities
approved Public Creators
or a controlled union of both
```

Do not serialize private user/account identity merely because an admin authored an Article.

If an approved Creator is referenced, public attribution may reuse canonical Public Creator identity.

If the author is editorial/site-owned, use an explicit public editorial author record rather than a private user row.

---

## 10. Manage Blog target

Route:

```text
/manage/blog
```

Expected V1 surfaces:

```text
article list
new article
edit article
metadata/status controls
slug validation
publish/update dates
EN/FA localization tabs or split workflow
Markdown editor
live preview
validation summary
hero/media insertion
save/export/publish actions
```

Manage must produce the same repository Article contract consumed by public SSR.

No proprietary editor document format may become the canonical article body.

Canonical body remains Markdown.

---

## 11. Manage permission target

Add explicit authorization capability in both backend and frontend permission registries.

Candidate:

```text
blog.manage
```

V1 role mapping should be deliberate.

Initial expected direction:

```text
admin       -> blog.manage
super_admin -> *
user        -> none
```

This remains to be confirmed during implementation audit against desired editorial ownership.

---

## 12. Media target

Blog image flow:

```text
/manage/blog editor
-> user selects/pastes image
-> project-owned Blog media upload endpoint
-> shared Arvan storage/signing primitives
-> stored public media
-> callback returns stable URL + metadata
-> Markdown receives URL/reference
```

Do not embed image bytes/base64 in Markdown.

Desired metadata where practical:

```text
id
fullUrl
thumbnailUrl
width
height
alt
caption
```

Storage object namespace should be Blog-specific rather than reusing Archive item paths.

Candidate:

```text
blog/<articleId>/<mediaId>/...
```

---

## 13. Repository save/publish workflow — audit required

The public source of truth is Git, but a deployed Docker container cannot be treated as a durable Git working tree.

4E must deliberately choose the management publication adapter.

Candidate V1 paths to evaluate:

```text
A. admin-only server-side Git provider write at publish time
   -> writes repository Article files
   -> deployment/rebuild publishes canonical content

B. repository-package export workflow
   -> Manage produces validated article files
   -> operator commits them to Git

C. emergency Arvan publication
   -> temporary public content with explicit pending_git reconciliation metadata
```

Public requests never query GitHub regardless of which management adapter is selected.

The final V1 adapter should optimize for deterministic source-of-truth behavior, credential safety and operational simplicity.

---

## 14. Shared inventory integration

After publication semantics are locked, 4E adds Blog into the accepted 4D inventory pipeline.

Expected resource families:

```text
/blog
/fa/blog
/blog/:slug
/fa/blog/:slug
```

Rules:

```text
Blog index is advertised only when Blog public surface is enabled
Article route advertised only for authoritative published locale
sitemap and llms consume the same Blog inventory input
staging global noindex empties the complete inventory
```

Do not create a second Blog-only sitemap or llms generator.

---

## 15. Analytics target

V1 should instrument at least:

```text
blog_article_view
```

and one meaningful product action when present, such as:

```text
blog_prompt_open
blog_creator_open
blog_cta_click
```

Exact event naming must fit existing analytics conventions and must not use `admin_audit_log` as behavioral analytics.

---

## 16. Static + Nitro compatibility

Blog must work in both accepted paths:

```text
Docker/Nitro request-time SSR
legacy pnpm generate compatibility
```

Static generation must discover only published canonical Blog URLs from the same authoritative Article contract.

Blog implementation must not introduce request-time GitHub calls simply to make static generation work.

---

## 17. Implementation slices

Proposed execution order:

```text
4E.1 Article Contract + Repository Loader + Validation
4E.2 Public Blog Index + Article SSR + Markdown/SEO
4E.3 Shared Sitemap / llms / Static Inventory Integration
4E.4 Manage Blog Permission + Authoring UI
4E.5 Blog Media + Repository Publish / Emergency Adapter
4E.6 Aggregate Regression + External Staging + Static Acceptance
```

No slice becomes DONE without founder verification and explicit acceptance.

### 4E.1

Lock:

```text
repository file structure
article/localization schema
slug rules
publication states
public locale eligibility
Markdown renderer/sanitizer contract
runtime loader architecture
```

### 4E.2

Implement:

```text
/blog
/blog/:slug
/fa equivalents
SSR data loading
safe Markdown HTML
canonical/hreflang/OG/Twitter
Article/BlogPosting JSON-LD
404/canonical behavior
```

### 4E.3

Integrate:

```text
shared public inventory
sitemap
llms
static generation
```

### 4E.4

Implement:

```text
blog.manage permission
/manage/blog
article list/new/edit
md-editor-v3 integration if verification remains positive
EN/FA workflow
validation/live preview
```

### 4E.5

Implement/lock:

```text
Blog media upload
shared Arvan primitives
stable Markdown media URLs
repository publish adapter
emergency Arvan reconciliation path if in V1 scope
```

### 4E.6

Verify:

```text
accepted 4A–4D regression
public Blog EN/FA SSR
404/canonical/localization
Markdown safety
structured data
sitemap/llms parity
Manage authorization
media pipeline
static generation
external staging noindex
prompt-draft.ir untouched
```

---

## 18. Verification discipline

Before every founder verification request:

```text
inspect changed services
run focused source/unit tests first
no rebuild if not needed
frontend-only -> pnpm frontend
backend-only -> pnpm api
full stack only when genuinely required
```

Prefer adding focused commands such as:

```text
test:blog-contract
test:blog-public
test:blog-inventory
test:blog-manage
```

before a final aggregate:

```text
test:phase4e-final
smoke:phase4e-final
```

---

## 19. Non-negotiable rules

```text
DO NOT weaken authorization.
DO NOT expose protected Prompt/private Draft/private account data.
DO NOT query GitHub per public Blog request.
DO NOT make Arvan an uncontrolled second editorial source.
DO NOT put base64 image payloads in Markdown.
DO NOT make editor-specific document state canonical.
DO NOT create fake localized Blog URLs.
DO NOT expose draft/unpublished Article URLs in sitemap/llms.
DO NOT create independent Blog indexability logic beside the Article contract.
DO NOT let Blog SEO override NUXT_PUBLIC_NOINDEX=true.
DO NOT touch prompt-draft.ir before explicit rollout.
```

---

## 20. Current next action

```text
4E.1 — Article Contract + Repository Loader + Validation
AUDIT / DESIGN NEXT
```

Before implementation, complete the remaining audit for:

```text
current content/bundling options in Nuxt/Nitro
Markdown parser/sanitizer dependency choice
repository publication adapter
Blog author identity model
exact Blog manage permission mapping
```
