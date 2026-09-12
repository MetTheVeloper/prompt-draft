# Milestone 21.5 — Phase 5.2 Acquisition Measurement Verification

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-12**

Date: 2026-09-12

Branch:

```text
feature/growth-foundation
```

Parent source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE5_LAUNCH_READINESS.md
```

## 1. Scope

This record captures founder-local verification and acceptance of the Phase 5.2 acquisition-measurement implementation. It does not authorize production cutover and does not change the accepted production boundary.

Phase 5.2 extends the existing first-party `product_analytics_events` pipeline across accepted acquisition surfaces and protected Prompt copy/unlock intent while keeping completed unlock and Goin spend on transactional source-of-truth tables.

## 2. Automated verification

Founder pulled the authoritative branch and ran the focused verification sequence required by `DEVELOPMENT_WORKFLOW.md`.

```text
pnpm test:product-analytics-web -> PASS 5/5
pnpm api                        -> PASS / API rebuilt and healthy
pnpm test:product-analytics     -> PASS 8/8
pnpm frontend                   -> PASS / Nuxt client + SSR/Nitro build successful
pnpm stack:cloudflare:status    -> PASS / frontend, api, db, translator healthy; cloudflared up
```

Verified contracts include:

```text
public Prompt + Creator views -> client-mounted only
Blog index + Article views     -> canonical client-mounted resources
Discovery view                 -> taxonomy-backed routes only
Prompt copy/unlock intent      -> recorded before action completion
admin growth aggregation       -> acquisition/intent reporting while transactional tables remain conversion truth
trusted conversion event names -> rejected by public analytics endpoint
```

Observed sourcemap, chunk-size, deprecated transitive dependency and Compose orphan warnings were non-blocking. The running Cloudflare service was confirmed up after the service-scoped rebuilds; `--remove-orphans` is not an appropriate cleanup action for that staging topology.

## 3. Staging public-acquisition behavioral smoke

Founder confirmed the running frontend environment:

```text
NUXT_PUBLIC_API_BASE=https://api.grassic.ir
NUXT_PUBLIC_SITE_URL=https://grassic.ir
NUXT_PUBLIC_NOINDEX=true
```

Representative staging surfaces were opened from server-authoritative inventory/taxonomy data:

```text
https://grassic.ir/prompt/6
https://grassic.ir/creator/grassias
https://grassic.ir/blog
https://grassic.ir/discover/portrait-photography
```

Persisted browser-originated events were then confirmed directly in `product_analytics_events`:

```text
public_prompt_view     | public_prompt    | 6                    | /prompt/6                      | en
public_creator_view    | public_creator   | grassias             | /creator/grassias              | en
public_blog_index_view | public_blog      | index                | /blog                          | en
public_discovery_view  | public_discovery | portrait-photography | /discover/portrait-photography | en
```

This verifies the runtime path:

```text
browser client mount
  -> useProductAnalytics
  -> https://api.grassic.ir/api/analytics/events
  -> backend validation / ingestion
  -> product_analytics_events persistence
```

No English published Blog Article slug was available from the staging public Blog listing during the smoke. `public_blog_article_view` therefore remained an unavailable-fixture runtime check, not a failed path. Its contract is covered by the passing frontend instrumentation and backend validation tests and may be re-smoked when a published staging Article exists.

## 4. Protected Prompt intent + copy behavioral smoke

Founder opened the protected Prompt flow for Prompt `6` and confirmed the ordered analytics sequence in the database:

```text
prompt_unlock_clicked | public_prompt       | 6 | /prompts?id=6 | en
prompt_copy_clicked   | public_prompt       | 6 | /prompts?id=6 | en
prompt_archive_copy   | prompt_archive_item | 6 | /prompts?id=6 | en
```

Observed ordering:

```text
unlock intent
-> copy intent
-> successful clipboard copy
```

Result: **PASS**.

This proves the new intent events do not replace the pre-existing copy-success event and that unlock intent is emitted only on the unlock-required path.

## 5. Admin growth / launchFunnel behavioral smoke

Founder called:

```text
GET https://api.grassic.ir/api/admin/growth/summary?days=7
```

with an authorized admin session and received:

```text
HTTP 200
```

Observed `launchFunnel` evidence included:

```text
publicPromptViews: 1
publicPromptViewSessions: 1
publicCreatorViews: 2
publicCreatorViewSessions: 1
publicBlogIndexViews: 1
publicBlogIndexViewSessions: 1
publicBlogArticleViews: 0
publicBlogArticleViewSessions: 0
publicDiscoveryViews: 1
publicDiscoveryViewSessions: 1
copyClicks: 1
copyClickSessions: 1
unlockClicks: 1
unlockClickSessions: 1
completedUnlocks: 16
```

Observed economy evidence included:

```text
issued: 150
spent: 85
netFlow: 65
outstanding: 375
holders: 13
activeSpenders: 1
```

Result: **PASS**.

The important trust boundary is preserved: `completedUnlocks` is derived from `user_content_unlocks`, and Goin issue/spend metrics are derived from `user_economy_events`; neither is accepted as client-authored conversion truth.

## 6. Accepted measurement contract

```text
acquisition views / click intent -> product_analytics_events
successful clipboard copy        -> prompt_archive_copy observational success event
completed Prompt unlock          -> user_content_unlocks
Goin issue/spend                  -> user_economy_events
```

The public analytics endpoint does not accept trusted conversion names such as `prompt_unlock_completed` or `goin_spent`.

Initial-launch attribution remains privacy-minimal:

```text
raw document.referrer -> NOT CAPTURED
arbitrary query strings -> NOT CAPTURED
normalized/allowlisted source attribution -> optional future follow-up, not required for Phase 5.2 acceptance
```

## 7. Acceptance

Phase 5.2 is accepted because the implementation now has:

```text
focused frontend contract tests -> PASS
focused backend validation tests -> PASS
fresh API + frontend runtime builds -> PASS
Cloudflare staging topology health -> PASS
public acquisition browser -> API -> DB persistence -> PASS
protected Prompt intent + copy ordering -> PASS
admin launchFunnel API -> HTTP 200 / expected counters -> PASS
trusted conversion/economy source separation -> PASS
```

The unavailable published staging Blog Article fixture is deferred evidence only and is not a Phase 5.2 blocker because the route/event contract is already covered by automated tests and no runtime defect was observed.

## 8. Production boundary

Phase 5.2 acceptance does **not** authorize production cutover.

Keep:

```text
grassic.ir staging noindex -> unchanged
prompt-draft.ir             -> untouched
production DNS/Tunnel       -> untouched
production Worker policy    -> untouched
production Search Console   -> no submission until approved production launch
```

Next milestone gate: continue Phase 5.1 readiness closure and founder signoff. Phase 5.3 production cutover remains blocked until readiness is accepted and the founder explicitly authorizes the production-changing operation.
