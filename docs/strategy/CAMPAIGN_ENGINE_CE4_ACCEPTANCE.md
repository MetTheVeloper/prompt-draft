# Campaign Engine — CE4 Acceptance Checkpoint

Status: **CE4 DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13**

Date: 2026-09-13

Branch: `feature/growth-foundation`

Acceptance HEAD at verification start: `c25dc084ff72a30854551facba5d95af8afc6bd9`

## Scope accepted

CE4 is accepted as the public Campaign experience and trusted-mechanics slice.

- CE4.1 — Public Campaign page + participation start: accepted in the earlier CE4 founder-local checkpoint.
- CE4.2 — Custom Game runtime: accepted in the earlier CE4 founder-local checkpoint.
- CE4.3 — Chance Wheel: accepted after trusted server-authoritative outcome handling, attempt gating, frontend rendering, and founder-local verification.
- CE4.4 — Generic Runtime Notices: accepted after founder-local visual verification of exhausted-attempt messaging in both locales and both themes.

## CE4.3 / CE4.4 final evidence

Founder verification confirmed the exhausted Chance Wheel state with zero remaining attempts and the generic runtime notice surface in:

- English / dark theme
- English / light theme
- Persian / dark theme
- Persian / light theme

Observed fallback copy:

- EN title: `No attempts available`
- EN body: `There are no attempts available for this activity right now.`
- FA title: `فعلاً نوبتی باقی نمونده`
- FA body: `در حال حاضر نوبت دیگری برای این فعالیت در دسترس نیست.`

The notice remains presentation-only. Attempt availability, exhaustion, reset timestamps, eligibility, rewards, and outcomes remain server-authoritative.

For resettable attempt policies, the countdown contract is based on backend-projected `serverNow` and `nextEligibleAt`; reaching zero only triggers a state refresh and never unlocks an attempt in the browser.

CE4.4 introduced no SQL migration.

## Invariants preserved

- Browser is not authoritative for Chance Wheel result, attempt availability, reward amount, reward expiry, or eligibility.
- Published Campaign Versions remain immutable.
- Campaign rewards continue through the existing Campaign runtime and the sole authoritative Goin ledger.
- Runtime notices are generic Campaign presentation, not mechanic-specific business rules.
- `NUXT_PUBLIC_NOINDEX=true` remains unchanged; production indexability is still deferred.

## Next slice

**CE4.5 — Shared Telegram Publishing Foundation**

Execution order follows `TELEGRAM_PUBLISHING_SYSTEM_SCHEDULING.md`:

1. TG1 — Shared backend publishing foundation
2. TG2 — Shared Telegram composer + `/manage/telegram`
3. TG3 — Archive adapter
4. TG4 — Campaign adapter in CE5

Telegram remains Preview + CTA / entry distribution. Prompt Draft remains authoritative for Campaign identity, participation, eligibility, attempts, outcomes, rewards, and economy.
