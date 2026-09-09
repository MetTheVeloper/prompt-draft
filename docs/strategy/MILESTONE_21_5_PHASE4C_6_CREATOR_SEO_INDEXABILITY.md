# Milestone 21.5 — Phase 4C.6 Creator SEO + Indexability

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_PUBLIC_CREATOR_ARCHITECTURE.md
docs/strategy/MILESTONE_21_5_PHASE4C_VERIFICATION.md
```

This slice adds SEO projection to the already founder-accepted Public Creator API and SSR route. It does not redefine Creator eligibility, accessibility, indexability, or privacy.

---

## 1. Locked SEO projection

Canonical public Creator routes remain:

```text
EN/default -> /creator/:username
FA         -> /fa/creator/:username
```

Per locale:

```text
screenName[locale] -> visible H1 + document/OG/Twitter title source
bio[locale]        -> visible intro + meta/OG/Twitter description source
article[locale]    -> long-form localized authoritative page content
```

The existing `usePublicSeo` helper remains the canonical head-projection mechanism so Creator SEO follows the same public-surface semantics already accepted for Public Prompt.

---

## 2. Canonical + hreflang contract

For canonical username `grassias`:

```text
https://<site>/creator/grassias
https://<site>/fa/creator/grassias
```

Each locale route emits:

```text
self canonical
hreflang en-US -> EN/default route
hreflang fa-IR -> FA route
x-default      -> EN/default route
```

Mixed-case/noncanonical username redirects remain owned by 4C.5 and happen before SEO projection.

---

## 3. Robots/indexability contract

Server-authoritative backend policy remains:

```text
indexable = accessible && creatorProfileComplete
```

Frontend projection:

```text
creator.policy.indexable == true  -> index, follow
creator.policy.indexable == false -> noindex, nofollow, noarchive
```

The existing global staging switch always wins:

```text
NUXT_PUBLIC_NOINDEX=true
```

Therefore staging remains noindex even for an otherwise indexable approved Creator.

Published Prompt count remains irrelevant to Creator indexability.

---

## 4. Social preview image

Creator social image priority:

```text
cover.fullUrl
-> avatarUrl
-> /pwa-512x512.png
```

The selected image feeds OG/Twitter metadata through `usePublicSeo`.

---

## 5. Structured data

Implemented utility:

```text
app/utils/publicCreatorSeo.ts
```

Schema:

```text
ProfilePage
  mainEntity -> Person
```

Safe localized projection may include:

```text
ProfilePage.name
ProfilePage.url
ProfilePage.description
ProfilePage.image
ProfilePage.inLanguage
ProfilePage.isPartOf WebSite

Person.name
Person.alternateName (@username)
Person.url
Person.description
Person.image (avatar only)
Person.sameAs (sanitized public profile links)
Person.knowsAbout (localized controlled skill names)
```

Explicitly excluded from JSON-LD:

```text
internal UUID
email
birthday
role
account status
Creator lifecycle/review state
review notes
XP
Goin/balance
permissions
sessions
referrals
private Drafts
storage keys
location provider metadata
admin audit metadata
```

Location display text remains visible on the page but is intentionally not projected into Person residence/home-location semantics because the field is a free public display string, not a verified residence claim.

---

## 6. Page wiring

`app/pages/creator/[username].vue` projects:

```text
localized ScreenName -> usePublicSeo.title
localized Bio        -> usePublicSeo.description
canonical Creator path
EN + FA alternate locales
policy-driven noindex
cover/avatar/fallback social image
ProfilePage + Person JSON-LD
```

No new backend endpoint or database migration is introduced by 4C.6.

---

## 7. Focused tests

Test:

```text
scripts/public-creator-seo.test.ts
```

Commands:

```text
pnpm test:public-creator-seo
pnpm test:public-creator-web
```

Coverage includes:

```text
cover -> avatar -> fallback image priority
localized EN ProfilePage + Person JSON-LD
localized FA structured data
private sentinel leakage prevention
page wiring to usePublicSeo
reciprocal EN/FA locale declaration
policy-driven noindex projection
```

The aggregate `test:public-creator-web` command includes the SEO suite.

---

## 8. Founder-local verification evidence

Automated evidence on 2026-09-09:

```text
pnpm test:public-creator-seo -> 5/5 PASS
pnpm test:public-creator-web -> 19/19 PASS
pnpm locale:check -> Missing fallback EN 0 / Public Creator FA missing 0 / extra 0
```

The SEO test initially exposed a Node/tsx-only module-resolution issue caused by Nuxt `~` aliases inside the pure SEO utility. The utility imports were changed to relative paths; this was a test/runtime compatibility fix and did not change the SEO contract.

Founder then manually verified the staging source/head for both canonical locale routes:

```text
https://grassic.ir/creator/grassias
https://grassic.ir/fa/creator/grassias
```

Verified staging behavior:

```text
localized EN/FA title
localized EN/FA meta description
self canonical per locale
reciprocal en-US / fa-IR hreflang
x-default -> EN/default Creator route
localized OG title/description/url/image
localized Twitter title/description/image
ProfilePage JSON-LD with Person mainEntity
localized ProfilePage/Person name and description
Person.alternateName = @grassias
public skills in knowsAbout
public links in sameAs
no private account fields observed in JSON-LD
NUXT_PUBLIC_NOINDEX=true preserved staging noindex
```

The founder explicitly reported that every requested SEO smoke check was correct.

Founder explicit acceptance:

```text
4C.6 تاییده.
```

Result:

```text
4C.6 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
```

---

## 9. Next slice

4C.7 may now proceed because the Public Creator policy, API, SSR route, and SEO/indexability slices are all founder-accepted.

```text
4C.7 — Prompt/Discovery Creator Attribution
```
