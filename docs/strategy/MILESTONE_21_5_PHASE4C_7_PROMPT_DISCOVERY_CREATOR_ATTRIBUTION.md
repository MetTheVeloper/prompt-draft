# Milestone 21.5 — Phase 4C.7 Prompt / Discovery Creator Attribution

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

Accepted dependencies:

```text
4C.4 Public Creator Policy + Sanitized API
4C.5 Public Creator SSR
4C.6 Creator SEO + Indexability
```

This slice does not redefine ownership, Creator eligibility, or public Prompt visibility. It only decides when Archive provenance may become a public Creator attribution and projects the minimum safe identity needed to link to the accepted public Creator route.

---

## 1. Audit finding

Before this slice, Public Prompt intentionally had no Creator attribution.

Discovery/Home Showcase did have an `owner` projection, but it was based on this heuristic:

```text
prompt_archive_items.source_user_id
-> users.id
-> users.status == active
-> expose username/avatar
```

That heuristic became invalid after the explicit Creator architecture was accepted. An active account is not necessarily a public Creator.

4C.7 removes the `active user == public owner` assumption and converges Public Prompt, Home Showcase and Public Discovery on the same accepted Creator accessibility policy.

---

## 2. Accepted attribution eligibility

The provenance source remains authoritative:

```text
prompt_archive_items.source_user_id
```

A published Archive item receives public Creator attribution only when that source identity satisfies the accepted Creator accessibility policy:

```text
source user exists
AND users.status == active
AND creator_accounts.status == approved
AND username is canonical
```

This intentionally uses the **accessible** Creator gate rather than the `indexable` gate.

Therefore an approved accessible Creator whose profile is defensively incomplete may still be linked as the same public identity while the Creator page itself becomes noindex.

The following remain valid and simply return `creator: null`:

```text
published Prompt from ordinary active user
pending Creator
rejected Creator
Creator-suspended identity
account-suspended identity
invalid/noncanonical username
legacy/provenance-less Archive item
```

Public Prompt visibility is never revoked merely because Creator attribution is unavailable.

---

## 3. Accepted minimal public attribution DTO

Public Prompt and Discovery use the same positive allowlist:

```ts
creator: {
  username: string
  avatarUrl: string | null
} | null
```

No ScreenName/Bio/Article/profile metadata is duplicated into Prompt or Discovery payloads. Consumers link to the canonical Creator page when more identity content is needed.

Explicitly absent:

```text
internal user UUID
source_user_id
email
birthday
role/account status
Creator lifecycle status
review metadata
XP/Goin
permissions/sessions/referrals
private Draft data
storage keys
provider/admin metadata
```

The browser also applies strict attribution normalization and rejects noncanonical usernames or unsafe avatar URL protocols.

---

## 4. Shared backend policy projection

Implemented:

```text
backend/src/publicCreatorAttribution.mjs
```

The mapper calls the accepted Creator public policy and emits attribution only when `policy.accessible == true`.

This prevents a second independent Creator definition from appearing in Public Prompt or Discovery.

Avatar metadata is presentation-only. An unsafe/missing avatar is reduced to `null` and never blocks an otherwise accessible Creator attribution.

---

## 5. Public Prompt attribution

`GET /api/public/prompts/:id` joins provenance through:

```text
items.source_user_id
-> users
-> creator_accounts
```

Selected internal account/Creator-state fields are used only to evaluate accessibility and are never serialized.

Public Prompt DTO gains only:

```text
creator: PublicCreatorAttribution | null
```

Frontend `usePublicPrompt` performs a positive normalization of this field.

The canonical Public Prompt route renders attribution in the existing Prompt presentation metadata area and links locale-safely to:

```text
/creator/:username
/fa/creator/:username
```

The route continues to expose no raw Prompt body, variants, source Draft id, source user UUID or protected account/product state.

---

## 6. Discovery convergence

`backend/src/homeDiscovery.mjs` powers both:

```text
/api/home/showcase
/api/discover
```

The former direct active-user `owner` projection is removed.

Discovery now evaluates the same source user + Creator state through the shared attribution mapper and returns:

```text
creator: PublicCreatorAttribution | null
```

The old public vocabulary `owner` is removed from the migrated frontend showcase type/UI. Archive ownership/provenance remains internal; the public concept is approved Creator attribution.

Both Home Discovery and public `/discover/:slug` cards link avatar/handle to the localized canonical Creator route. Cards without Creator attribution remain otherwise unchanged and fully usable.

The query is one joined projection; it does not perform an N+1 call to the full Public Creator API for every card.

---

## 7. Browser contract

Pure browser utility:

```text
app/utils/publicCreatorAttribution.ts
```

Responsibilities:

```text
canonical username validation
HTTP/HTTPS avatar validation
positive { username, avatarUrl } projection
null = intentionally unattributed
undefined = malformed attempted attribution
```

Consumers:

```text
app/composables/usePublicPrompt.ts
app/composables/useHomeDiscovery.ts
app/pages/prompt/[id].vue
app/components/home/HomeDiscoverySection.vue
app/components/discover/PublicDiscoveryCard.vue
```

No browser route needs an internal UUID to resolve a Creator link.

---

## 8. Accepted automated verification

Founder-local evidence on 2026-09-09:

```text
docker compose exec api npm run test:creator-attribution -> 17/17 PASS
docker compose exec api npm run test:public-creator      -> 10/10 PASS
pnpm test:creator-attribution-web                         -> 13/13 PASS
pnpm test:phase4b-final                                   -> PASS
pnpm locale:check                                         -> PASS
```

The Phase 4B final regression included:

```text
SEO route contracts PASS
Public Prompt browser/SSR DTO PASS
Public Prompt SEO PASS
localized Public Prompt description PASS
shared Prompt presentation PASS
Public Discovery visual layer PASS
Public Prompt link migration PASS
interaction polish PASS
strict locale-routing audit -> 463 source files / no hazards
```

The runtime localization gate reported:

```text
Missing fallback EN keys      -> 0
Public Creator missing in FA  -> 0
Public Creator extra in FA    -> 0
```

Global FA parity debt remains informational and is not a 4C.7 regression.

---

## 9. Accepted founder smoke / acceptance

Founder completed the requested verification sequence and explicitly accepted the slice:

```text
4C.7 تایید. خیلی هم عالی
```

The automated state matrix is accepted for negative non-Creator/unavailable attribution cases when no convenient staging UI fixture exists; production-like data does not need to be mutated solely to manufacture a negative browser fixture.

Result:

```text
4C.7 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
```

Next:

```text
4C.8 — Aggregate + Staging Acceptance
```
