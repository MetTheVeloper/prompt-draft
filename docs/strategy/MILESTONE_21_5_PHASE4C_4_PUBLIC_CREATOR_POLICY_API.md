# Milestone 21.5 — Phase 4C.4 Public Creator Policy + Sanitized Backend Projection

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

Verification ledger:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_VERIFICATION.md
```

This slice establishes the single backend definition of a public Creator and exposes the first privacy-safe public Creator DTO. It does not create the Nuxt `/creator/:username` route; that remains 4C.5.

---

## 1. Public Creator policy

Implemented pure evaluator:

```text
evaluateCreatorPublicPolicy(...)
```

Policy signals:

```text
accountActive
creatorApproved
canonicalUsername
creatorProfileComplete
hasPublishedPrompt
```

Accessibility:

```text
accessible =
  account exists
  AND account status == active
  AND creator_accounts.status == approved
  AND canonical username is valid lowercase project username
```

Indexability:

```text
indexable = accessible && creatorProfileComplete
```

Discoverability V1:

```text
discoverable = indexable
```

Published Prompt count is deliberately not a gate.

An approved Creator with zero published Archive Prompts remains a valid public Creator.

The policy keeps internal `reasons` + detailed `signals` for server/tests. Public API responses expose only the safe outcomes needed by later SEO work:

```ts
policy: {
  indexable: boolean
  discoverable: boolean
}
```

Internal reasons/signals never appear in generic 404s.

---

## 2. Public endpoint

Implemented:

```text
GET /api/public/creators/:username
```

Lookup is directly username-keyed. Browser consumers never resolve username to an internal UUID first.

Accepted route behavior:

```text
approved + active + canonical username -> 200
none                               -> generic 404
pending                            -> generic 404
rejected                           -> generic 404
Creator suspended                  -> generic 404
account suspended/inactive         -> generic 404
invalid/non-canonical username     -> generic 404
non-GET                            -> 405 / Allow: GET
```

The backend does not reveal which unavailable state caused the 404.

Lowercase/canonical browser redirect UX remains 4C.5. The API itself accepts only canonical username form.

---

## 3. Positive public DTO allowlist

Successful response:

```ts
{
  ok: true,
  creator: {
    identity: {
      username: string,
      screenName: { en: string, fa: string },
      bio: { en: string, fa: string },
      article: { en: string, fa: string },
      avatarUrl: string | null,
      cover: {
        fullUrl: string,
        thumbnailUrl: string,
        width: number | null,
        height: number | null,
        thumbnailWidth: number | null,
        thumbnailHeight: number | null
      } | null,
      skills: Array<{
        slug: string,
        categorySlug: string,
        title: { en: string, fa: string }
      }>,
      links: Array<{
        type: string,
        url: string,
        label: string | null
      }>,
      location: { text: string } | null
    },
    publications: PublicCreatorPublicationSummary[],
    policy: {
      indexable: boolean,
      discoverable: boolean
    }
  }
}
```

Public link projection defensively re-validates HTTP/HTTPS URLs and supported link types even though authenticated profile editing already validates them.

Public location includes display text only.

Article remains Markdown **source** at this boundary. Sanitized HTML rendering is intentionally 4C.5.

---

## 4. Defensive incomplete-approved behavior

Normal approval invariants require complete localized Creator content and at least one active skill.

However legacy/corrupt/migrated data may violate that invariant.

Therefore an otherwise accessible approved Creator remains accessible while:

```text
policy.indexable = false
policy.discoverable = false
```

The DTO degrades safely:

```text
missing screen name -> canonical username fallback
missing bio/article -> empty localized string
```

This preserves the accepted distinction between public accessibility and SEO eligibility without leaking internal corruption reasons.

---

## 5. Canonical publication summaries

Creator publications are read only from:

```text
prompt_archive_items.status == published
AND source_user_id == Creator internal user id
AND public_id IS NOT NULL
```

The internal UUID is used only inside the database join and never enters the public DTO.

Public publication summary:

```ts
{
  id: number,
  title: Partial<Record<'en' | 'fa', string>>,
  description: Partial<Record<'en' | 'fa', string>>,
  availableLocales: Array<'en' | 'fa'>,
  publishedAt: string,
  coverImage: {
    fullUrl: string,
    thumbnailUrl: string
  } | null
}
```

Raw Draft payloads and protected Archive Prompt bodies are never selected.

Explicitly absent:

```text
prompt body
variants
source_user_id
source_draft_id
storage keys
unlock/economy/viewer data
```

Malformed publication rows without any complete authoritative title+description locale are omitted from the Creator summary rather than breaking the whole Creator page projection.

---

## 6. Privacy boundary

Public Creator SQL intentionally does not select:

```text
email
birthday
role
account review metadata
Creator review note/reviewer
XP
economy/Goin
permissions
sessions
referrals
avatar/cover storage keys
location provider place id
location country/provider metadata
private Draft data
admin audit data
```

The test fixture additionally injects private sentinel fields into raw rows and asserts that none survive serialization.

The following are internal-only even though they are needed to calculate policy or joins:

```text
users.id UUID
account status
Creator lifecycle status
hasPublishedPrompt signal
policy reasons/signals
```

---

## 7. Implementation files

```text
backend/src/publicCreator.mjs
backend/src/publicCreator.test.mjs
backend/src/publicPrompt.mjs
backend/package.json
```

The existing public-surface router in `publicPrompt.mjs` now delegates `/api/public/creators/...` to the dedicated Creator handler before applying Prompt-specific routing. Existing Public Prompt behavior remains unchanged.

Focused command:

```text
npm run test:public-creator
```

---

## 8. Verification gate

Founder-local required:

```powershell
git pull
pnpm api
docker compose exec api npm run test:public-creator
docker compose exec api npm run test:public-prompt
```

No schema migration is required for 4C.4.

Suggested API smoke with an approved staging/local Creator:

```text
GET /api/public/creators/<approved-username> -> 200
```

Confirm response contains:

```text
identity.username
localized screenName/bio/article
avatar/cover safe URLs
active public skills
public links
location.text only
canonical published publication summaries
policy.indexable/discoverable
```

Confirm response does NOT contain:

```text
email
birthday
role
account/Creator status
review note/reviewer
UUID
XP/Goin
permissions/sessions/referrals
storage keys
provider place id
raw Prompt/Draft payload
```

Unavailable-state smoke should confirm the same response shape/message for:

```text
pending
rejected
Creator suspended
non-Creator
missing username
```

Expected generic response:

```json
{
  "ok": false,
  "message": "Public Creator not found"
}
```

---

## 9. Acceptance rule

4C.4 remains:

```text
IMPLEMENTED / FOUNDER-LOCAL VERIFICATION PENDING
```

until:

```text
public Creator focused suite PASS
Public Prompt regression PASS
approved Creator API smoke PASS
generic unavailable-state 404 smoke PASS
privacy inspection PASS
explicit founder acceptance
```

After acceptance, 4C.5 may build the Nuxt SSR Creator route on this DTO without re-inventing Creator eligibility or reading authenticated/admin profile contracts.
