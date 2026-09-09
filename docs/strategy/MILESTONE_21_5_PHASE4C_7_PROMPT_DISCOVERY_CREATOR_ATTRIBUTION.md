# Milestone 21.5 — Phase 4C.7 Prompt / Discovery Creator Attribution

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

Accepted dependencies:

```text
4C.4 Public Creator Policy + Sanitized API
4C.5 Public Creator SSR
4C.6 Creator SEO + Indexability
```

This slice does not redefine ownership, Creator eligibility, or public Prompt visibility. It only decides when Archive provenance may become a public Creator attribution and projects the minimum safe identity needed to link to the accepted public Creator route.

---

## 1. Audit finding that triggered 4C.7

Before this slice, Public Prompt intentionally had no Creator attribution.

Discovery/Home Showcase did have an `owner` projection, but it was based on this heuristic:

```text
prompt_archive_items.source_user_id
-> users.id
-> users.status == active
-> expose username/avatar
```

That heuristic was no longer valid after the explicit Creator architecture was accepted. An active account is not necessarily a public Creator.

4C.7 therefore removes the `active user == public owner` assumption and converges Public Prompt, Home Showcase and Public Discovery on the same accepted Creator accessibility policy.

---

## 2. Attribution eligibility

The provenance source remains authoritative:

```text
prompt_archive_items.source_user_id
```

A published Archive item receives public Creator attribution only when that source identity satisfies the already accepted Creator accessibility policy:

```text
source user exists
AND users.status == active
AND creator_accounts.status == approved
AND username is canonical
```

This is intentionally the **accessible** Creator gate, not the `indexable` gate.

Therefore a defensive approved Creator whose profile has become incomplete may still be linked as the same accessible public identity while the Creator page itself is noindex. Profile completeness and publication count do not redefine attribution identity.

The following remain valid and simply have `creator: null`:

```text
published Prompt from ordinary active user
pending Creator
rejected Creator
Creator-suspended identity
account-suspended identity
invalid/noncanonical username
legacy/provenance-less Archive item
```

Public Prompt visibility is never revoked merely because public Creator attribution is unavailable.

---

## 3. Shared minimal public attribution DTO

Both Public Prompt and Discovery use the same positive allowlist:

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

The browser also runs a strict attribution normalizer and rejects noncanonical usernames or unsafe avatar URL protocols.

---

## 4. Shared backend policy projection

Implemented:

```text
backend/src/publicCreatorAttribution.mjs
```

The mapper calls the exact accepted:

```text
evaluateCreatorPublicPolicy(...)
```

exported by `publicCreator.mjs` and emits attribution only when `policy.accessible == true`.

This prevents a second independent Creator definition from appearing in Public Prompt or Discovery.

Avatar metadata is presentation-only. An unsafe/missing avatar is reduced to `null` and never blocks an otherwise accessible Creator attribution.

---

## 5. Public Prompt attribution

`GET /api/public/prompts/:id` now joins provenance through:

```text
items.source_user_id
-> users
-> creator_accounts
```

The selected internal account/Creator-state fields are used only to evaluate accessibility and are never serialized.

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

The route still exposes no raw Prompt body, variants, source Draft id, source user UUID or protected product/account state.

---

## 6. Discovery convergence

`backend/src/homeDiscovery.mjs` powers both:

```text
/api/home/showcase
/api/discover
```

The former direct active-user `owner` join/projection is removed.

Discovery now evaluates the same source user + Creator state through the shared attribution mapper and returns:

```text
creator: PublicCreatorAttribution | null
```

The old public vocabulary:

```text
owner
```

is removed from the frontend showcase type and UI. This is deliberate: Archive ownership/provenance exists internally, while the public concept is approved Creator attribution.

Both Home Discovery and public `/discover/:slug` cards link the avatar/handle to the localized canonical Creator route. A card without Creator attribution remains otherwise unchanged and fully usable.

The query is one joined projection; it does not perform an N+1 call to the full Public Creator API for each card.

---

## 7. Browser contract

New pure browser utility:

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

## 8. Focused tests

Backend:

```text
backend/src/publicCreatorAttribution.test.mjs
backend/src/homeDiscoveryAttribution.test.mjs
backend/src/publicPrompt.test.mjs
```

Command:

```text
npm run test:creator-attribution
```

Coverage:

```text
approved/active/canonical attribution
pending/rejected/suspended/inactive/null/noncanonical -> null
minimal positive allowlist
private sentinel leakage prevention
unsafe avatar -> null avatar only
source_user_id remains SQL provenance join
Discovery removes active-user owner heuristic
non-Creator Prompt remains public/unattributed
Public Prompt protected-field regression remains enforced
```

Frontend:

```text
scripts/public-creator-attribution.test.ts
scripts/public-prompt-client-contract.test.ts
scripts/public-discovery-visual-contract.test.ts
```

Command:

```text
pnpm test:creator-attribution-web
```

Coverage:

```text
browser attribution positive allowlist
canonical username / safe avatar validation
Public Prompt locale-safe Creator link
Home/Public Discovery Creator vocabulary
no `.owner` public heuristic in migrated surfaces
no source user id / UUID / email in attribution UI
```

Existing 4B-focused regression should remain green after the attribution extension.

---

## 9. Founder-local verification gate

Because both API and frontend changed but there is no migration, use the smallest service scopes:

```powershell
git pull

pnpm api
docker compose exec api npm run test:creator-attribution
docker compose exec api npm run test:public-creator

pnpm test:creator-attribution-web
pnpm test:phase4b-final
pnpm locale:check

pnpm frontend
```

No `db:schema` and no full `pnpm stack` are required.

Manual staging smoke should verify an approved Creator-owned Prompt plus an unattributed/non-Creator fixture when available:

```text
[ ] approved Creator attribution appears on Public Prompt
[ ] Creator attribution links to locale-safe Creator route
[ ] Home Discovery approved Creator attribution links correctly
[ ] Public Discovery approved Creator attribution links correctly
[ ] ordinary/non-Creator published item remains public but has no Creator attribution
[ ] no UUID/email/private owner data appears in browser/API payloads
```

If a convenient non-Creator published fixture does not exist on staging, the automated policy matrix is acceptable for that negative case; do not mutate production-like data solely to manufacture a UI fixture.

---

## 10. Acceptance rule

Until focused backend/frontend regression, browser smoke and explicit founder acceptance:

```text
4C.7 -> IMPLEMENTED / FOUNDER-LOCAL VERIFICATION PENDING
```

After acceptance:

```text
4C.8 — aggregate/staging acceptance
```
