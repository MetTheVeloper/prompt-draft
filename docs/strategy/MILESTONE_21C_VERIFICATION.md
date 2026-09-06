# Milestone 21C — User Preferences & Personalized Discovery Verification

Status: **DONE / LOCALLY VERIFIED / USER ACCEPTED**

Branch:

```text
feature/growth-foundation
```

Final accepted implementation checkpoint before this verification document:

```text
708dec8877bfef4dd0f3462aad897a6322f27ff0
```

## 1. Accepted scope

Milestone 21C is closed as a complete product slice, not only as preference persistence.

The accepted experience now includes:

```text
account-level discovery preferences
six stable discovery-interest keys
interest -> real Archive tag-bundle mapping
multi-tag Archive filtering with OR/union semantics
multi-tag URL deep links
reusable global preference modal
personalized full-screen homepage hero
personalized hero media sourced from published Archive media
six immersive category showcase sections
selected-interest-first section ordering
responsive 1/2/3-column viewport grid
Dark/Light theme-aware overlays and card presentation
```

## 2. Database verification

Migration `021_user_preferences.sql` was applied locally.

Verified table:

```text
user_preferences
```

Verified constraints include:

```text
PRIMARY KEY (user_id)
FOREIGN KEY -> users(id) ON DELETE CASCADE
maximum six discovery interests
no NULL array entries
```

Verified real persisted example:

```text
username = grass
discovery_interests = {portrait_photography}
```

Persistence survived reload and remained account-scoped.

## 3. Prompt Archive multi-tag verification

Locally accepted behavior:

```text
Tag UI uses multi-select
one or more selected tags are sent in one Archive request
repeated ?tag= parameters use OR/union semantics
URL preserves repeated tag parameters
hard refresh restores existing real tags
nonexistent URL tags are discarded after availableTags reconciliation
homepage interest bundles navigate using all mapped tags
```

Example canonical shape:

```text
/prompts?tag=poster&tag=editorial
```

The existing Archive taxonomy remains authoritative; discovery-interest keys do not replace Archive tags.

## 4. Personalized homepage verification

The initial compact interest panel was intentionally replaced by a full personalized homepage experience.

Accepted behavior:

```text
signed-in user with no interests -> reusable global interest modal opens
signed-in user with interests    -> no forced modal
Tune my feed                     -> reopens the same reusable modal
saving interests                 -> refreshes personalized hero + section order
anonymous visitor                -> broad/non-account personalized hero fallback
```

The global modal is reusable from future surfaces and does not duplicate preference persistence.

## 5. Hero verification

Accepted final hero behavior:

```text
full available viewport below the real Header
existing tiled slider renderer reused
up to 50 published Archive media sources from selected interest tag bundles
broad Archive media fallback when no explicit interests exist
legacy static slider source fallback if the homepage media API fails
new discovery-oriented product copy
Explore prompts CTA
Create from scratch CTA
Tune my feed CTA for authenticated users
bottom-centered scroll affordance
```

Final visual polish was accepted in both Dark and Light themes.

Theme rules now include:

```text
system theme-surface overlays instead of hardcoded black
normal theme text instead of forced white
normal theme buttons where appropriate
hero center receives the stronger theme veil and edges the lighter veil
Explore prompts uses the normal button color contract
```

## 6. Showcase section verification

Six current discovery categories are represented as immersive sections.

Each section locally accepted with:

```text
height = viewport below Header
up to five published Archive items
active image as full-section background
autoplay + previous/next + position controls
category title + category description
active Prompt title
active Prompt tags
published date
preview-image count
owner avatar/username only when authoritative source_user_id attribution exists
View Prompt action
Telegram action only when telegramUrl exists
```

Responsive composition uses the existing `useScreen()` states:

```text
mobile             -> one full-width section per row
tablet/laptop      -> up to two half-width sections per row
desktop/wide       -> up to three one-third-width sections per row
```

Odd remainders are balanced instead of leaving empty cells.

## 7. Theme/accessibility polish verification

The final accepted polish removed fixed Dark-theme assumptions from the homepage showcase and preference modal.

Verified direction:

```text
section overlays -> themeSurface alpha shades
section text     -> normal theme text
Prompt title     -> normal theme text + inverse-theme text shadow for contrast
tag badges       -> marker=invert + color=normal
actions          -> normal theme color contract
slide indicators -> normalText theme shades
preference modal -> normalText/theme-aware option states
```

The user explicitly reviewed Light and Dark screenshots and accepted the result.

## 8. Public-preview API boundary

Homepage preview APIs were accepted as presentation-only primitives:

```text
GET /api/home/hero-media
GET /api/home/showcase
```

They expose published media/presentation metadata only.

They do **not** expose:

```text
prompt body
prompt variants
private Draft data
invented creator ownership
```

The protected `/api/archive/:id` content boundary remains unchanged.

## 9. Build verification

User reported:

```text
pnpm generate -> PASS
```

This was confirmed after the final 21C visual/theme polish.

## 10. Closure

Milestone 21C is therefore:

```text
DONE
LOCALLY VERIFIED
USER ACCEPTED
```

The next Growth Foundation phase is:

```text
21D — Public Discovery & SEO Foundation
```

21D must preserve the current release invariant until a rendering ADR explicitly says otherwise:

```text
ssr: false
pnpm generate
static frontend
independent Node API
```
