# Milestone 21.5 — Phase 5.2 Acquisition Measurement Verification

Status: **FOUNDER-LOCAL AUTOMATED VERIFICATION PASS / BEHAVIORAL SMOKE PENDING**

Date: 2026-09-12

Branch:

```text
feature/growth-foundation
```

Verified branch head before this evidence record:

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

## 3. Verified trust boundary

Automated verification preserves the accepted measurement trust boundary:

```text
acquisition views / click intent -> product_analytics_events
successful clipboard copy        -> observational success event
completed Prompt unlock          -> user_content_unlocks
Goin issue/spend                  -> user_economy_events
```

Client analytics are not authoritative conversion evidence.

## 4. Remaining acceptance gate

Phase 5.2 is not yet marked fully accepted because behavioral/runtime smoke evidence is still required.

Remaining checks:

```text
1. visit representative public Prompt route and confirm public_prompt_view is stored
2. visit representative public Creator route and confirm public_creator_view is stored
3. visit Blog index and a valid Article and confirm both Blog view events
4. visit a valid Discovery route and confirm public_discovery_view
5. exercise protected Prompt copy and locked-unlock intent paths
6. verify /api/admin/growth/summary?days=7 exposes the expected launchFunnel counters
7. compare completed unlock / Goin evidence against transactional source-of-truth tables, not client events
```

Initial-launch attribution policy remains privacy-minimal:

```text
raw document.referrer -> NOT CAPTURED
arbitrary query strings -> NOT CAPTURED
normalized/allowlisted source attribution -> optional future follow-up, not required for Phase 5.2 acceptance
```

## 5. Production boundary

No production-changing action is authorized by this verification record.

Keep:

```text
grassic.ir staging noindex -> unchanged
prompt-draft.ir             -> untouched
production DNS/Tunnel       -> untouched
production Worker policy    -> untouched
production Search Console   -> no submission until approved production launch
```

Next gate: behavioral smoke + `launchFunnel` verification, then Phase 5.2 can be marked founder-local accepted if no regression is found.
