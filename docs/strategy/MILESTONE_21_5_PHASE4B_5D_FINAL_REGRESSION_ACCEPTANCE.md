# Milestone 21.5 — Phase 4B.5D Final Regression / Founder Acceptance

Status: **DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED**

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
4B.5A localized descriptions       -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED AS SLICE
4B.5B shared Prompt presentation   -> DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE
4B.5C Discovery visual layer       -> DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE
```

Phase 21.5.4B received explicit founder acceptance after every gate in this record passed.

---

## 1. Objective

4B.5D is the final regression and staging verification gate for Phase 21.5.4B Public Prompt Architecture.

No new product behavior was introduced by this acceptance slice. Its purpose was to prove that the completed public acquisition surfaces preserve all previously accepted routing, localization, SEO, data-boundary and protected-product behavior.

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

Verification environment:

```text
https://grassic.ir       -> staging verification target
https://api.grassic.ir   -> staging browser API target
prompt-draft.ir          -> untouched
NUXT_PUBLIC_NOINDEX=true -> preserved and authoritative
```

---

## 2. Aggregate automated regression gate — PASS

Canonical command:

```text
pnpm test:phase4b-final
```

Runner:

```text
scripts/phase4b-final-regression.mjs
```

Final founder run on 2026-09-08:

```text
SEO contracts                         -> 5/5 PASS
Public Prompt browser/SSR DTO         -> 6/6 PASS
Public Prompt SEO                     -> 4/4 PASS
Localized Public Prompt description   -> 3/3 PASS
Shared Prompt presentation            -> 4/4 PASS
Public Discovery visual layer         -> 3/3 PASS
Public Prompt link migration          -> 3/3 PASS
Interaction polish                    -> 4/4 PASS
Strict locale-routing audit           -> PASS / 447 source files / zero hazards

[phase4b-final] PASS: all frontend/SEO/routing/presentation/discovery regression gates passed.
```

The first aggregate-run attempt exposed only a Windows harness issue (`spawnSync pnpm.cmd EINVAL`). The runner was made shell-compatible without changing the gate list or product behavior, then the complete bundle passed.

This bundle verifies:

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

## 3. Backend protected/public regression gate — PASS

Founder ran against the rebuilt API container:

```text
docker compose exec api npm run test:public-prompt
docker compose exec api npm run test:archive-description-input
docker compose exec api npm run test:archive-published-localization
```

Final results:

```text
public Prompt backend regression       -> PASS
Archive description input              -> PASS
published localization enforcement     -> PASS
```

Verified backend invariants include:

```text
public Prompt projection allowlist PASS
published-only semantics PASS
localized title+description availability PASS
public query still excludes Prompt body/variants PASS
Admin localized description validation PASS
publish localization enforcement PASS
GET /api/archive/:id remains protected
```

The existing 4B.5A backfill/prune tooling did not need to execute against data during final acceptance; its unit and founder-data verification had already passed during 4B.5A.

---

## 4. Production-like build/runtime gate — PASS

Canonical staging-connected lifecycle:

```text
pnpm stack:cloudflare:restart
pnpm stack:cloudflare:status
```

Final founder-observed state:

```text
frontend    healthy
api         healthy
db          healthy
translator  healthy
cloudflared up
```

Nuxt client/SSR/Nitro production builds completed successfully during the accepted 4B.5 rollout and the final staging-connected stack remained healthy.

---

## 5. Automated staging smoke — PASS

Canonical command:

```text
pnpm smoke:phase4b-final
```

Runner:

```text
scripts/phase4b-final-staging-smoke.mjs
```

Canonical default fixtures:

```text
Prompt id      -> 511
Discovery slug -> portrait-photography
```

The initial explicit invocation used the noncanonical typo `portraits-photography`, correctly returning Discovery 404. The script default contained the same typo and was corrected. No route alias or product workaround was introduced; the final smoke uses the actual canonical Discovery slug.

Final staging output:

```text
public Prompt API: 200
invalid public Prompt API: 404
protected Archive detail API: 401
EN Public Prompt SSR: 200
FA Public Prompt SSR: 200
EN Discovery SSR: 200
FA Discovery SSR: 200

[phase4b-smoke] PASS: staging public API, EN/FA SSR, SEO, noindex and protected-boundary smoke passed.
```

The staging smoke verified:

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

## 6. Manual founder browser smoke — PASS

Founder explicitly confirmed the manual smoke was green.

Accepted browser/runtime observations include:

```text
Public Prompt EN/FA renders localized title, authored description and media
Public surface exposes no protected controls/content
Open full prompt enters localized protected /prompts?id=<id>
protected auth/email/unlock/copy/economy behavior remains functional
public and protected back buttons use browser history
LTR/RTL back arrow semantics are correct
Telegram badge/link opens canonical Telegram post in a new tab when metadata exists
shared Prompt presentation is readable in light and dark themes
Discovery EN/FA hero is content-sized
Discovery slider is clipped to the hero
Discovery has no duplicate static+animated media layer after hydration
Discovery outer default-layout padding is zero
prompt-draft.ir remained untouched
```

---

## 7. Security and public-data boundary — PASS

Final accepted public/protected split:

```text
GET /api/public/prompts/:id -> public sanitized published-only projection
GET /api/archive/:id        -> authenticated protected detail
/prompt/:id                 -> public SSR acquisition surface
/prompts?id=<id>             -> protected product/unlock surface
```

Public presentation may include only intentionally public metadata such as localized title/description, publication metadata, tags, preview/model presentation data and approved public-safe Telegram post metadata.

Still forbidden from public projection/presentation:

```text
protected Prompt body
variants
source Draft/private payload
source user identity unless explicitly introduced by later Creator policy
storage keys
unlock state
balance/Goin
permissions
authenticated viewer/account state
```

The public database query itself remains forbidden from selecting protected Prompt body or variants.

---

## 8. Acceptance equation — SATISFIED

```text
4B.1–4B.4 inherited founder verification green
+ 4B.5A accepted slice green
+ 4B.5B founder visual/runtime verification PASS
+ 4B.5C founder visual/runtime verification PASS
+ pnpm test:phase4b-final PASS
+ backend final regression PASS
+ production-like Cloudflare stack build/health PASS
+ pnpm smoke:phase4b-final PASS
+ protected authenticated browser smoke PASS
+ founder explicit acceptance: "Phase 4B accepted"
= Phase 21.5.4B ACCEPTED
```

---

## 9. Final state

```text
4B.5A localized descriptions          -> DONE / ACCEPTED
4B.5B shared Prompt presentation      -> DONE / ACCEPTED
4B.5C Discovery visual layer          -> DONE / ACCEPTED
4B.5D final regression / acceptance   -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
Phase 21.5.4B                         -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
```

Next execution slice:

```text
Phase 21.5.4C — Public Creator + Indexability Policy
```

Phase 4 overall remains in progress; 4C must begin from the already accepted public/protected, localization and SEO boundaries established by 4A and 4B.
