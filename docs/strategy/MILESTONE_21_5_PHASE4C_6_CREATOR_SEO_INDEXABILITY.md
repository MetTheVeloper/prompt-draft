# Milestone 21.5 — Phase 4C.6 Creator SEO + Indexability

Status: **IMPLEMENTED / FOUNDER-LOCAL VERIFICATION PENDING**

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

`app/pages/creator/[username].vue` now projects:

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

New test:

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

The aggregate `test:public-creator-web` command now includes the SEO suite.

---

## 8. Founder-local verification gate

Required focused automated checks:

```powershell
pnpm test:public-creator-web
pnpm locale:check
pnpm frontend
docker compose exec api npm run test:public-creator
```

Manual staging source/head checks on both locale routes should verify:

```text
localized title
localized description
self canonical
EN/FA hreflang
x-default -> EN
OG/Twitter title + description + image
ProfilePage JSON-LD with Person mainEntity
no private fields in serialized JSON-LD
staging robots remains noindex because NUXT_PUBLIC_NOINDEX=true
```

For a future local/prod-like environment with global noindex disabled, an indexable Creator should emit `index, follow`; a defensive accessible-but-nonindexable Creator should emit `noindex, nofollow, noarchive`.

Acceptance remains pending until founder-local verification and explicit founder acceptance.
