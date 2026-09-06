# Milestone 21 — UI Polish Closure Pass

Status: **IN PROGRESS**

Date: 2026-09-06

Branch:

```text
feature/growth-foundation
```

## Purpose

Milestone 21A–21F are functionally complete and locally verified. This final pass is intentionally presentation-only: tighten the Growth Foundation surfaces without reopening product scope or changing economic/analytics semantics.

## Scope

Primary surfaces:

```text
/manage/growth
/manage/economy
private Profile Menu Goin presentation
Prompt Archive unlock/copy presentation
```

Current first polish slice:

```text
shared Manage metric-card typography/spacing tightened
Growth and Economy summary cards become less oversized on desktop
numeric values use tabular figures
card labels/helpers wrap more predictably in EN/FA
Growth referral open-to-signup helper explicitly explains that the aggregate may exceed 100%
```

Because `ManageMetricCard` is shared by the new Growth and Economy surfaces, the card polish improves both without creating duplicate presentation systems.

## Non-goals

```text
no backend behavior change
no new analytics event
no economy policy change
no migration 025
no new Growth metric
no new Marketplace feature
no redesign of the global Manage shell
```

## Theme / localization rules

```text
keep existing theme tokens/components
no fixed white/black text inferred from screenshots
preserve Light/Dark behavior
preserve EN/FA + RTL
prefer normal/theme-aware text colors
```

## Verification gate

After the polish commits:

```text
git pull
pnpm generate
```

Then visually smoke-test:

```text
/manage/growth EN Light
/manage/growth FA Light
/manage/growth FA Dark
/manage/economy desktop
Profile Menu with Goin balance
locked and unlocked Prompt Archive Copy states
```

Milestone 21 is only closed after this polish pass is accepted.
