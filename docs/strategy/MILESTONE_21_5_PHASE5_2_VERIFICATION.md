# Milestone 21.5 — Phase 5.2 Acquisition Measurement Verification

Status: **FOUNDER-LOCAL AUTOMATED VERIFICATION PASS / PUBLIC ACQUISITION BEHAVIORAL SMOKE PASS / INTENT + GROWTH SUMMARY PENDING**

Date: 2026-09-12

Branch:

```text
feature/growth-foundation
```

Verified branch head before initial evidence record:

```text
3580edc4aea14db11574bc38c7d489884fb02c61
```

Parent source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE5_LAUNCH_READINESS.md
```

## 1. Scope

This record captures founder-local verification of the Phase 5.2 acquisition-measurement implementation. It does not authorize production cutover and does not change the accepted production boundary.

Phase 5.2 extends the existing first-party `product_analytics_events` pipeline across accepted acquisition surfaces and Prompt copy/unlock intent while keeping completed unlock and Goin spend on their transactional source-of-truth tables.

## 2. Founder-local automated verification

Founder pulled authoritative branch head successfully with a fast-forward from `919d6189` to `3580edc4`.

### Frontend instrumentation contract

Command:

```powershell
pnpm test:product-analytics-web
```

Result:

```text
PASS 5/5
```

Verified contracts:

```text
public Prompt + Creator views -> client-mounted only
Blog index + Article views     -> canonical client-mounted resources
Discovery view                 -> taxonomy-backed routes only
Prompt copy/unlock intent      -> recorded before action completion
admin growth aggregation       -> acquisition/intent reporting while transactional tables remain conversion truth
```

### API rebuild

Command:

```powershell
pnpm api
```

Result:

```text
PASS
prompt-draft-api image rebuilt
API container restarted
DB healthy
translator healthy
API healthy after startup
```

### Backend analytics contract

Command:

```powershell
pnpm test:product-analytics
```

Result:

```text
PASS 8/8
```

Verified contracts:

```text
existing Prompt archive analytics remains valid
public Prompt acquisition/intent validation passes
public Creator username validation passes
Blog index/article slug validation passes
Discovery taxonomy slug validation passes
invalid uppercase/path-like/unbounded slugs are rejected
resource/event mismatches are rejected
trusted conversion event names remain unavailable to the public analytics endpoint
```

### Frontend production build/runtime refresh

Command:

```powershell
pnpm frontend
```

Result:

```text
PASS
Nuxt client build PASS
Nuxt SSR/server build PASS
Nitro node-server output PASS
prompt-draft-frontend image rebuilt
frontend container started healthy
```

Observed build warnings are non-blocking and pre-existing/outside the Phase 5.2 contract:

```text
Nuxt module-preload sourcemap warning
Rollup chunk-size warnings
pnpm deprecated transitive dependency warnings
```

### Cloudflare staging stack health

Command:

```powershell
pnpm stack:cloudflare:status
```

Result:

```text
PASS
frontend    -> healthy
api         -> healthy
db          -> healthy
translator  -> healthy
cloudflared -> up
```

The `orphan container (prompt-draft-cloudflared-1)` warning emitted by service-scoped `pnpm api` / `pnpm frontend` is expected because those shortcuts invoke the base Compose file without the Cloudflare override. It is not a failed service condition. `--remove-orphans` must not be used as a cleanup reaction here because it would remove the intentionally running Cloudflare service from the staging topology.

The Windows Git warning about inability to unlink two `.git/objects/pack/*.idx` files did not prevent fetch, object resolution, or fast-forward update. It is not a Phase 5.2 blocker. Investigate local file locking only if it recurs or later Git maintenance fails.

## 3. Founder staging behavioral smoke — public acquisition views

Founder confirmed the staging frontend runtime configuration directly from the running container:

```text
NUXT_PUBLIC_API_BASE=https://api.grassic.ir
NUXT_PUBLIC_SITE_URL=https://grassic.ir
NUXT_PUBLIC_NOINDEX=true
```

The original sitemap-based smoke discovery method was rejected after runtime evidence because staging intentionally runs with `NUXT_PUBLIC_NOINDEX=true`, and the accepted sitemap route returns an empty inventory when public indexing is disabled. Runtime smoke samples were instead resolved from server-authoritative public inventory / Blog API data plus the accepted Discovery taxonomy.

Resolved and opened staging surfaces:

```text
https://grassic.ir/prompt/6
https://grassic.ir/creator/grassias
https://grassic.ir/blog
https://grassic.ir/discover/portrait-photography
```

No English published Blog Article slug was returned by the public Blog listing during this smoke. Therefore the absence of `public_blog_article_view` in this run is an unavailable-fixture condition, not a failed event path. The Blog Article contract remains covered by the passing automated instrumentation and backend validation tests until a published staging Article is available for runtime smoke.

Founder queried `product_analytics_events` immediately after loading the public surfaces and confirmed persisted browser-originated events:

```text
public_prompt_view     | public_prompt    | 6                    | /prompt/6                      | en
public_creator_view    | public_creator   | grassias             | /creator/grassias              | en
public_blog_index_view | public_blog      | index                | /blog                          | en
public_discovery_view  | public_discovery | portrait-photography | /discover/portrait-photography | en
```

This is direct behavioral evidence that the staging path is operational end-to-end:

```text
browser client mount
  -> useProductAnalytics
  -> https://api.grassic.ir/api/analytics/events
  -> backend validation / ingestion
  -> product_analytics_events persistence
```

Result:

```text
PASS for all currently available representative public acquisition surfaces
```

## 4. Verified trust boundary

Verification preserves the accepted measurement trust boundary:

```text
acquisition views / click intent -> product_analytics_events
successful clipboard copy        -> observational success event
completed Prompt unlock          -> user_content_unlocks
Goin issue/spend                  -> user_economy_events
```

Client analytics are not authoritative conversion evidence.

## 5. Remaining acceptance gate

Phase 5.2 is not yet marked fully accepted because protected Prompt intent and aggregate reporting still need founder-local behavioral evidence.

Remaining checks:

```text
1. exercise protected Prompt copy flow and confirm prompt_copy_clicked
2. if the selected Prompt is locked, confirm prompt_unlock_clicked before the unlock attempt
3. after successful clipboard copy, confirm existing prompt_archive_copy success analytics still persists
4. verify /api/admin/growth/summary?days=7 exposes the expected launchFunnel counters
5. compare completed unlock / Goin evidence against transactional source-of-truth tables, not client events
6. when a published staging Blog Article becomes available, perform the deferred public_blog_article_view runtime smoke
```

Initial-launch attribution policy remains privacy-minimal:

```text
raw document.referrer -> NOT CAPTURED
arbitrary query strings -> NOT CAPTURED
normalized/allowlisted source attribution -> optional future follow-up, not required for Phase 5.2 acceptance
```

## 6. Production boundary

No production-changing action is authorized by this verification record.

Keep:

```text
grassic.ir staging noindex -> unchanged
prompt-draft.ir             -> untouched
production DNS/Tunnel       -> untouched
production Worker policy    -> untouched
production Search Console   -> no submission until approved production launch
```

Next gate: protected Prompt intent/copy behavioral smoke + `launchFunnel` verification, then Phase 5.2 can be marked founder-local accepted if no regression is found.
