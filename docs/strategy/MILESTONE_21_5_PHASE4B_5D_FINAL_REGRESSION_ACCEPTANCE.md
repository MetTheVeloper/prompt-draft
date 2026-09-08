# Milestone 21.5 — Phase 4B.5D Final Regression / Founder Acceptance

Status: **IN PROGRESS / FINAL FOUNDER VERIFICATION NEXT / NOT ACCEPTED**

Date: 2026-09-08

Branch:

```text
feature/growth-foundation
```

Parent hardening source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5_PUBLIC_SURFACE_HARDENING.md
```

Predecessor slices:

```text
4B.5A localized descriptions       -> FOUNDER-LOCAL VERIFIED / ACCEPTED AS SLICE
4B.5B shared Prompt presentation   -> FOUNDER-LOCAL VISUAL VERIFIED
4B.5C Discovery visual layer       -> FOUNDER-LOCAL VISUAL VERIFIED
```

Phase 21.5.4B itself remains **NOT ACCEPTED** until every gate below passes and the founder explicitly accepts the phase.

---

## 1. Objective

4B.5D is the final regression and staging verification gate for Phase 21.5.4B Public Prompt Architecture.

No new product behavior is introduced here. The purpose is to prove that the completed public acquisition surfaces preserve all previously accepted routing, localization, SEO, data-boundary and protected-product behavior.

Canonical public Prompt routes remain:

```text
/prompt/:id
/fa/prompt/:id
```

Protected product routes remain:

```text
/prompts?id=<id>
/fa/prompts?id=<id>
```

Environment:

```text
https://grassic.ir       -> staging verification target
https://api.grassic.ir   -> staging browser API target
prompt-draft.ir          -> MUST remain untouched
NUXT_PUBLIC_NOINDEX=true -> MUST remain authoritative
```

---

## 2. Aggregate automated regression gate

Canonical command:

```text
pnpm test:phase4b-final
```

Runner:

```text
scripts/phase4b-final-regression.mjs
```

It runs sequentially and fails fast on any non-zero gate:

```text
pnpm test:seo-contracts
pnpm test:public-prompt-web
pnpm test:public-prompt-seo
pnpm test:public-prompt-description
pnpm test:prompt-presentation
pnpm test:public-discovery-visual
pnpm test:public-prompt-links
pnpm test:interaction-polish
pnpm seo:audit-routes:strict
```

This bundle covers:

```text
canonical/localized route semantics
Public Prompt browser/SSR DTO validation
localized authored description contract
Public Prompt SEO + CreativeWork projection
shared presentation public/protected separation
SSR preview-media fallback
browser-history back behavior
Discovery semantic/visual contract
public acquisition-link migration
interaction polish
strict locale-routing hazards
```

Repository-wide localization debt remains outside the 4B acceptance gate unless a baseline/diff mechanism is introduced.

---

## 3. Backend protected/public regression gate

Run against the rebuilt API container:

```text
docker compose exec api npm run test:public-prompt
docker compose exec api npm run test:archive-description-input
docker compose exec api npm run test:archive-published-localization
```

Required outcomes:

```text
public Prompt projection allowlist PASS
published-only semantics PASS
localized title+description availability PASS
public query still excludes Prompt body/variants PASS
Admin localized description validation PASS
publish localization enforcement PASS
```

The existing backfill/prune tooling does not need to execute against data during final acceptance; its unit contracts were already verified during 4B.5A.

---

## 4. Production-like build/runtime gate

Canonical staging-connected rebuild:

```text
pnpm stack:cloudflare:restart
pnpm stack:cloudflare:status
```

Required status:

```text
frontend    healthy
api         healthy
db          healthy
translator  healthy
cloudflared up
```

A transient `health: starting` immediately after recreation is not final success; status must be re-run after health checks settle.

---

## 5. Automated staging smoke

Canonical command:

```text
pnpm smoke:phase4b-final -- 511 portraits-photography
```

Runner:

```text
scripts/phase4b-final-staging-smoke.mjs
```

Arguments:

```text
1. known published bilingual Prompt public id
2. known populated Discovery slug
```

Defaults are currently:

```text
Prompt id      -> 511
Discovery slug -> portraits-photography
```

The smoke gate checks real staging responses for:

```text
GET /api/public/prompts/:id -> 200
GET /api/public/prompts/0   -> 404
GET /api/archive/:id unauthenticated -> 401/403

EN /prompt/:id -> 200
FA /fa/prompt/:id -> 200
SSR localized title present
SSR founder-authored localized description present
SSR Prompt presentation image present
self canonical present
EN/FA reciprocal hreflang present
x-default present
OG description present
Twitter description present
CreativeWork JSON-LD present
staging X-Robots-Tag contains noindex
serialized protected private-key leakage -> zero

EN /discover/:slug -> 200
FA /fa/discover/:slug -> 200
semantic Discovery hero present
SSR first Discovery image present
self canonical present
staging X-Robots-Tag contains noindex
serialized protected private-key leakage -> zero
```

The script explicitly refuses to run if its configured site/API base contains `prompt-draft.ir`.

---

## 6. Manual founder browser smoke

Automated HTTP checks cannot replace the protected authenticated product smoke.

Required final browser checks:

```text
1. Open a Public Prompt from an acquisition surface.
2. Public Prompt renders localized title/description/media with no protected controls.
3. Open full prompt enters the localized protected /prompts?id=<id> flow.
4. Protected page still shows the expected auth/email/unlock/copy/economy behavior.
5. Unlock/copy remains functional for the founder test account and does not affect Public Prompt projection.
6. Public and protected back buttons use browser history with correct LTR/RTL arrow direction.
7. Telegram post badge/link opens the canonical post in a new tab when metadata exists.
8. Discovery EN/FA hero is content-sized, slider remains clipped to the hero, no duplicate static+animated media layer remains, and outer default-layout padding is zero.
9. Light and dark themes remain readable on shared Prompt and Discovery surfaces.
10. prompt-draft.ir is not modified or used as the verification target.
```

---

## 7. Acceptance equation

Phase 21.5.4B may be marked accepted only when:

```text
4B.1–4B.4 inherited founder verification remains green
+ 4B.5A accepted slice remains green
+ 4B.5B founder visual/runtime verification PASS
+ 4B.5C founder visual/runtime verification PASS
+ pnpm test:phase4b-final PASS
+ backend final regression PASS
+ production-like Cloudflare stack build/health PASS
+ pnpm smoke:phase4b-final PASS
+ protected authenticated browser smoke PASS
+ founder explicit acceptance
= Phase 21.5.4B ACCEPTED
```

Automated PASS alone is not founder acceptance.

---

## 8. Current checkpoint

```text
4B.5A localized descriptions          -> ACCEPTED AS SLICE
4B.5B shared Prompt presentation      -> FOUNDER-LOCAL VISUAL VERIFIED
4B.5C Discovery visual layer          -> FOUNDER-LOCAL VISUAL VERIFIED
4B.5D final regression / acceptance   -> IN PROGRESS / FINAL GATES NEXT
Phase 21.5.4B                         -> NOT ACCEPTED
```

Next action is to run the final commands above, capture the outputs, perform the short protected browser smoke, and obtain explicit founder acceptance.
