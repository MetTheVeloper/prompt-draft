# Milestone 21F — Growth Metrics Verification

Status: **DONE / LOCALLY VERIFIED / USER ACCEPTED**

Date: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Implementation source:

```text
docs/strategy/MILESTONE_21F_GROWTH_METRICS.md
```

## Local build/runtime verification

User locally ran:

```text
git pull
docker compose up -d --build api
pnpm generate
```

Result:

```text
API image rebuilt successfully
/manage/growth generated successfully
pnpm generate PASS
```

The build retained pre-existing non-blocking warnings about duplicate compilePromptOutput imports, sourcemap handling, chunk size, and the known `ssr:false` static-shell notice. No 21F-specific build failure occurred.

## UI verification

`/manage/growth` was visually checked in:

```text
English / Light
Persian / Light
Persian / Dark
```

Verified runtime behavior:

```text
Growth tab renders inside existing Manage shell
7-day view loads real data
30-day view loads real data
Refresh works
audience cards render
Prompt Archive cards render
referral cards render
Goin circulation cards render
daily UTC table renders
popular Prompt tags render
RTL remains usable
Dark theme remains usable
```

The measurement-scope warning remains visible so measured-surface audience is not misrepresented as whole-product DAU/MAU.

## Final API / SQL verification

A final verification script independently recalculated each 7-day and 30-day metric from PostgreSQL and compared it with:

```text
GET /api/admin/growth/summary?days=7
GET /api/admin/growth/summary?days=30
```

Authorization and validation:

```text
PASS  admin or super_admin metrics actor exists
PASS  anonymous growth metrics -> 401
PASS  ordinary user growth metrics -> 403
PASS  days=8 -> 400 GROWTH_WINDOW_INVALID
```

7-day window:

```text
PASS  API -> 200
PASS  audience summary matches DB
PASS  Prompt summary matches DB
PASS  referral summary matches DB
PASS  economy summary matches DB
PASS  trackedEvents matches DB
PASS  period.days is correct
PASS  daily series has exactly 7 rows
PASS  daily series exactly matches DB
PASS  Top Tags exactly match DB
PASS  measurement scope is explicit
PASS  measurement event allowlist is correct
```

30-day window:

```text
PASS  API -> 200
PASS  audience summary matches DB
PASS  Prompt summary matches DB
PASS  referral summary matches DB
PASS  economy summary matches DB
PASS  trackedEvents matches DB
PASS  period.days is correct
PASS  daily series has exactly 30 rows
PASS  daily series exactly matches DB
PASS  Top Tags exactly match DB
PASS  measurement scope is explicit
PASS  measurement event allowlist is correct
```

Final script result:

```text
ALL 21F GROWTH METRICS CHECKS PASSED
Cleaned 2 temporary auth session(s)
```

## Representative verified 7-day values

```text
Tracked visitors                  3
Tracked sessions                  3
Tracked authenticated users       1
Returning authenticated users     1
New accounts                     10

Prompt views                     11
Prompt copies                     9
Prompt view sessions              2
Prompt copy sessions              1
Copy-session rate               50%
Prompt unlocks                    3

Referral-link opens               2
Referral signups                  5
Referral share                   50%
Open-to-signup directional ratio 250%

Goin issued                     320
Goin spent                       15
Net flow                        305
Goin outstanding                305
Goin holders                     10
Active spenders                   1
Tracked analytics events         22
```

The `250%` referral open-to-signup value is not treated as a conversion rate. It is intentionally a directional aggregate because persisted referrals can exist without a tracked referral-link-open event. The UI wording was subsequently clarified so values above 100% are not misleading.

## Closure

Milestone 21F is closed as:

```text
DONE / LOCALLY VERIFIED / USER ACCEPTED
```

With 21A–21F functionally complete, the only remaining work before closing Milestone 21 is a small UI polish pass across the Growth Foundation surfaces. No new Growth capability is opened by that polish pass.
