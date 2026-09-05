# Milestone 20 — Profile Showcase, Draft Media & Archive Promotion

Status: `IN PROGRESS`

Selected: 2026-09-05

Branch: `feature/docker-local-api`

## Goal

Extend the verified Milestone 19 public-profile foundation without reopening its completed behavior.

Milestone 20 turns `/user` into a richer creator/showcase surface and introduces the infrastructure needed for user Draft preview media, moderation, and deliberate promotion of public user Drafts into the Prompt Archive.

Milestone 19 remains closed and verified. Milestone 20 is an additive extension.

## Invariants carried forward

```text
static Nuxt generation remains supported
pnpm generate remains a release invariant
backend authorization is authoritative
Cloud Drafts remain private by default
visitors never receive private Drafts
public profile APIs never expose email/private account data
Arvan credentials remain backend-only
new schema work starts at migration 017
applied migrations are never rewritten
important reward events require idempotency semantics
```

## Phase 20A — Profile UX polish + username profile alias

Status: `IMPLEMENTED / AWAITING LOCAL VERIFICATION`

### Profile Menu

Refine the current cover/avatar composition:

```text
avatar centered on the cover
avatar overlaps the cover edge by exactly 50% of avatar height
Profile Menu avatar visual grows by 12px
avatar becomes an interactive trigger
```

Clicking the avatar opens a secondary menu through the project Global Menu system while the parent Profile Menu remains open.

This is implemented as a reusable root/child Global Menu layer rather than a Profile-Menu-only popup. The child layer owns its own open/close/item state, renders above the root menu, and allows Escape to close the child before the parent.

Avatar child-menu actions:

```text
Choose / change avatar
Remove avatar (when an avatar exists)
```

The existing standalone avatar choose/remove FABs are removed. Prepared avatar preview + explicit Save/Cancel remains intact.

The reusable `el-avatar` fallback surface now uses the project glass treatment:

```text
bg="surface50"
bd="b4"
```

This applies to initials/person-icon fallback while real avatar images still fill the component normally.

Identity hierarchy becomes centered:

```text
name + compact XP badge
role
```

XP formatting:

```text
< 1,000 -> raw number
>= 1,000 -> compact K notation (for example 4.2K)
large values may use M notation
```

The previous standalone XP information row is removed.

`Member since` becomes a compact account-age readout based on current time, for example:

```text
Today
2D ago
```

The lower action area becomes one compact row:

```text
Manage       -> fg100
View profile -> FAB
Sign out     -> FAB
```

Existing progressive-profile completion behavior remains available.

### Global Tooltip portal

The shared `el-tooltip` no longer participates in the trigger/container layout.

Tooltip bubbles are teleported to the project `#teleports` layer and positioned with `position: fixed` from the owning component's DOM rectangle. The floating layer:

```text
does not change parent width/height
is not clipped by ancestor overflow:hidden
keeps pointer-events disabled
clamps to viewport safe padding
flips to the opposite side when the preferred side has insufficient room
tracks resize/scroll while open
attaches viewport listeners only while visible
```

This is a central tooltip fix and therefore applies to FAB/button tooltips throughout the project rather than only the Profile Menu.

### Username profile alias

Keep UUID as the canonical backend/user identity.

Support both frontend entry forms:

```text
/user?id=<USER_UUID>
/user?un=<username>
```

Username lookup is case-insensitive and resolves to the existing user UUID/read model. No second profile implementation is introduced.

Implemented public-safe resolver:

```text
GET /api/users/resolve?username=<username>
```

The resolver returns only user UUID + username for active users. It does not expose email or private account state.

### Draft-card border correction

Draft cards use the EL border-color system rather than direct CSS border-color overrides:

```text
normal -> bc="normal15"
hover  -> bc="normal50"
```

The existing hover lift remains, but border color is driven through the `el-flex` `bc` prop.

### Phase 20A acceptance

```text
Profile Menu avatar is centered and overlaps cover by exactly half its height
Profile Menu avatar is 12px larger than the previous visual
avatar fallback uses surface50 + backdrop blur 4
avatar opens a child Global Menu without closing Profile Menu
avatar choose/remove flows work
prepared avatar Save/Cancel still work
name/role are centered
XP appears as compact badge beside name and old XP row is gone
member age is compact and relative
View profile is a FAB beside Manage and Sign out
Manage grows with fg100; View profile and Sign out remain compact FABs
shared tooltips render outside clipped containers without changing parent/menu layout
/user?id=<uuid> still works
/user?un=<username> resolves the same profile
Draft cards use normal15/normal50 EL border colors for normal/hover
EN/FA copy remains valid
pnpm generate succeeds
```

Phase 20A is not `DONE` until the user verifies the behavior locally.

## Phase 20B — Cloud Draft preview media

Status: `PLANNED`

Add a new numbered schema migration, expected to begin at:

```text
017_*.sql
```

Draft preview media is a first-class relational resource rather than data embedded into `prompt_drafts.snapshot`.

Expected properties:

```text
multiple images per Cloud Draft
stable image UUIDs
ordered position
owner + draft identity
immutable Arvan object keys
full URL + source dimensions/bytes
cascade with Draft deletion
```

Browser media preparation contract:

```text
input: JPEG / PNG / WebP
output: WebP
quality: 0.60
preserve original pixel dimensions
no crop
no resize
```

Safety limits may reject unreasonable inputs but must not silently resize them.

Draft image storage uses a dedicated immutable namespace separate from Archive media.

Owner `/user` card actions gain media management. Position 0 is the primary card image. Multiple stored images remain available for later richer presentation and Archive promotion.

Avoid running a continuously animated canvas slider for every card by default; card-grid performance remains a product constraint.

## Phase 20C — Moderation + Promote to Prompt Archive

Status: `PLANNED`

### Permissions

Use existing permission semantics where possible:

```text
archive.manage     -> Add to prompts
drafts.delete_any -> delete another user's Cloud Draft
```

Current role mapping means Admin/Super Admin can manage Archive content while arbitrary Draft deletion remains a Super Admin capability unless the role policy is deliberately changed later.

Backend checks remain authoritative.

### Promote public Draft

Only a public Draft may be promoted from another user's public profile.

The action opens the central modal and asks for:

```text
English title
Persian title
optional Telegram post/message ID
```

Promotion creates a Prompt Archive `draft`, not an automatically published item.

Archive provenance must be explicit. The expected schema extension includes source identity such as:

```text
source_kind = user_draft
source_user_id
source_draft_id
```

A uniqueness rule should prevent accidental duplicate promotion of the same user Draft.

### Telegram assumptions

Current Archive rows require a Telegram message ID and Telegram URL. User-Draft promotion has no inherent Telegram source.

A later numbered migration must therefore make Telegram-specific fields optional where appropriate and audit all assumptions in:

```text
create/edit validation
search
ordering
snapshot export
public Archive mapping
Manage deep links
Telegram URL generation
```

Legacy Telegram-backed items remain fully compatible.

### Media independence

When Draft preview images are promoted to Prompt Archive, Archive media becomes independent of the user's Draft media.

Do not merely point Archive rows at user-owned Draft media URLs. Copy promoted images into Archive-owned storage keys so later user image deletion cannot break published Prompt Archive content.

### Moderation deletion

Super Admin may delete a Draft when `drafts.delete_any` is granted.

Deletion requires:

```text
confirmation UI
backend permission enforcement
audit event
DB cleanup
best-effort Arvan object cleanup
```

An Archive item previously created from that Draft remains independent.

## Verification rule

Each phase is locally verified before it is marked complete.

Frontend-affecting closure always includes:

```text
pnpm generate
```

Milestone 20 is marked `DONE` only after all selected phases are locally verified by the user.
