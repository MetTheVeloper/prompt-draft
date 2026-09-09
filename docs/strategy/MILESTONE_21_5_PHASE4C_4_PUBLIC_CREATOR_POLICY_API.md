# Milestone 21.5 — Phase 4C.4 Public Creator Policy + Sanitized Backend Projection

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED**

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

This slice establishes the single backend definition of a public Creator and exposes the privacy-safe public Creator DTO consumed by later SSR/SEO work.

---

## 1. Accepted Public Creator policy

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

Published Prompt count is deliberately not a gate. An approved Creator with zero published Archive Prompts remains a valid public Creator.

Internal `reasons` and detailed policy `signals` remain server-only. The public response exposes only:

```ts
policy: {
  indexable: boolean
  discoverable: boolean
}
```

---

## 2. Accepted public endpoint

```text
GET /api/public/creators/:username
```

Lookup is directly username-keyed. Browser consumers never resolve username to an internal UUID first.

Behavior:

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

Unavailable state is intentionally indistinguishable:

```json
{
  "ok": false,
  "message": "Public Creator not found"
}
```

Lowercase browser redirect UX belongs to 4C.5. The API itself accepts canonical username form only.

---

## 3. Accepted positive public DTO allowlist

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
      cover: PublicCover | null,
      skills: PublicSkill[],
      links: PublicProfileLink[],
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

Public location includes display text only. Article remains Markdown source at this boundary; sanitized HTML rendering is a 4C.5 responsibility.

---

## 4. Defensive incomplete-approved behavior

Normal approval invariants require complete localized Creator content and at least one active skill.

Legacy/corrupt/migrated data may violate that invariant. Therefore an otherwise accessible approved Creator remains accessible while:

```text
policy.indexable = false
policy.discoverable = false
```

The DTO degrades safely:

```text
missing screen name -> canonical username fallback
missing bio/article -> empty localized string
```

This preserves the accepted accessibility/indexability distinction without exposing internal corruption reasons.

---

## 5. Accepted canonical publication summaries

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

Malformed publication rows without any complete authoritative title+description locale are omitted rather than breaking the whole Creator projection.

---

## 6. Accepted privacy boundary

Public Creator SQL intentionally does not select or serialize:

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

The following remain internal-only even though needed for policy or joins:

```text
users.id UUID
account status
Creator lifecycle status
hasPublishedPrompt signal
policy reasons/signals
```

Positive allowlists are the primary privacy boundary; denylist/sentinel tests are defense in depth.

---

## 7. Accepted implementation files

```text
backend/src/publicCreator.mjs
backend/src/publicCreator.test.mjs
backend/src/publicPrompt.mjs
backend/package.json
```

The existing public-surface router in `publicPrompt.mjs` delegates `/api/public/creators/...` to the dedicated Creator handler before applying Prompt-specific routing. Existing Public Prompt behavior remains unchanged.

Focused command:

```text
npm run test:public-creator
```

---

## 8. Founder-local verification evidence — 2026-09-09

Founder ran:

```powershell
git pull
pnpm api
docker compose exec api npm run test:public-creator
docker compose exec api npm run test:public-prompt
pnpm frontend
```

Results:

```text
test:public-creator -> 10/10 PASS
test:public-prompt  -> 10/10 PASS
frontend Docker production build -> PASS
```

The focused Creator suite verifies:

```text
public policy matrix
zero-publication approved Creator remains valid
approved-incomplete accessible/noindex distinction
sanitized positive allowlist
private sentinel leakage scan
published-only canonical publication summaries
generic none/pending/rejected/suspended 404 behavior
invalid/noncanonical username no-query behavior
GET/405 routing behavior
```

Founder also exercised the approved staging Creator endpoint:

```text
GET https://api.grassic.ir/api/public/creators/grassias
```

Observed result:

```text
200 / ok=true
username=grassias
localized ScreenName/Bio/Article present
active localized skills present
public website link present
location.text only
publications=[]
policy.indexable=true
policy.discoverable=true
no private denylist fields observed
```

This specifically proves the accepted zero-publication rule on a real approved Creator projection.

Founder explicit acceptance:

```text
4C.4 رو ببند بریم سراغ 4C.5
```

---

## 9. Result

```text
4C.4 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
```

4C.5 may now consume only this DTO to build `/creator/:username` and `/fa/creator/:username`. It must not reintroduce authenticated/admin profile projections or independently redefine Creator eligibility.
