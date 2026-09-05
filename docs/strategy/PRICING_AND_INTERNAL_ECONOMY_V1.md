# Prompt Draft — Pricing & Internal Economy V1

Status: **Founder-approved direction; exact numbers intentionally unset**

---

# 1. Core value principle

Users do not primarily pay for the number of words in a prompt or the engineering effort that is visible to the founder.

Users pay to reduce the human cost of reaching a useful result.

That value may include:

- time saved;
- thinking/setup reduced;
- fewer mistakes;
- better structure/quality;
- reduced repetitive labor;
- at organization scale, reduced staffing/process cost.

Therefore:

> price should follow value/impact more than product complexity.

---

# 2. Product type is a baseline, not a price rule

Prompt, Template and Workflow have different typical value shapes, but there is no hard rule that:

```text
Prompt < Template < Workflow
```

A highly specialized Prompt can be more valuable than a generic Workflow.

Product type is useful as a comparison cohort for market pricing intelligence.

---

# 3. Creator-controlled pricing

Creators set their own price.

Prompt Draft should not block a Creator merely because the platform thinks the price is too high.

If a Creator chooses an unreasonable price and the market refuses to buy, that is market feedback.

The platform may impose only rules required for safety, law, ownership/remix contracts or system integrity.

---

# 4. Pricing Intelligence UX

The publish/edit surface should eventually show market context from genuinely comparable products.

Comparison should at minimum separate product types:

```text
Prompt vs Prompt
Template vs Template
Workflow vs Workflow
```

Category/domain should also be considered where enough data exists.

Potential metrics:

- average sold price;
- median sold price;
- minimum sold price;
- maximum sold price;
- sales/conversion context;
- number of comparable products/transactions.

Example:

```text
Comparable Workflows: 243
Average paid price: 180 internal units
Median: 150
Observed range: 20–900
```

This is guidance, not enforcement.

---

# 5. Internal unit / coin concept

Prompt Draft should eventually operate an internal virtual economy.

The unit may receive a branded name later. Naming is intentionally unresolved.

It is **not** intended to be:

- a cryptocurrency;
- blockchain-based;
- externally traded;
- an investment security;
- a market-priced token.

It is a platform accounting/incentive/exchange unit.

---

# 6. Why an internal economy

The founder wants the unit to do more than hide fiat prices.

It should create an incentive loop:

```text
useful activity / campaigns
  -> earn internal units
  -> spend on valuable knowledge/actions
  -> Creators receive economic value
  -> Creator supply grows
  -> ecosystem creates more useful activity
```

This makes gamification and marketplace economics one connected system.

---

# 7. Simulation-first rollout

The founder does not want to enable real-money economics before proving circulation.

Early phase:

- distribute internal units through selected rewards/referrals/campaigns;
- allow units to be spent on selected value extraction;
- measure earning, holding, spending and return behavior;
- do not promise external market value;
- treat the experiment as product/economy validation.

Potential test horizon discussed by founder: several months (for example six months to one year), but exact duration is not frozen.

If the loop proves healthy, later phases may introduce:

- buying internal units with fiat;
- Creator cash-out/payout;
- a defined platform conversion/accounting rate;
- funded early-balance recognition/reward where legally/product-wise appropriate.

Exact legal and financial design requires a dedicated later review.

---

# 8. Existing XP ledger reuse

Current verified foundation:

```text
user_score_events
```

Properties already solved:

- append-only ledger;
- per-user event history;
- deterministic idempotency keys;
- positive and negative non-zero integer points supported by schema;
- identity rewards;
- Draft-creation reward;
- referral rewards;
- total derived from ledger.

However, the current product semantics/read models call this **XP**, not a spendable wallet.

Therefore Growth Foundation must not create an unrelated second gamification ledger without first deciding the semantic transition.

Likely design questions include:

- evolve current ledger into the internal-unit ledger;
- preserve historical event types/rows;
- introduce spend/debit event types;
- expose spendable balance read model;
- separate Creator reputation/level from current spendable balance;
- rename UI/API semantics gradually without rewriting applied migrations.

Important: Creator Level must not simply equal current coin balance. Spending currency should not erase reputation.

---

# 9. Supply sources

Potential internal-unit sources include:

- account milestones;
- profile completion;
- referral;
- campaigns;
- meaningful contribution;
- Creator rewards;
- future purchase with fiat.

Do not reward meaningless repetitive activity merely to create engagement.

Existing Milestone 15 deliberately rejected reward-on-every-Draft-save because it encouraged farming/inflation.

That principle remains valid.

---

# 10. Demand / sinks

Discovery should remain low-friction/free.

Potential sinks should correspond to meaningful value extraction.

Examples discussed:

- first paid Prompt copy/unlock;
- Template personalization/finalization;
- repeated new Template personalization where economically justified;
- Workflow/product purchase;
- other future premium Execution Layer actions.

Viewing product pages, examples and Creator profiles should not be charged simply to manufacture spend.

---

# 11. First-copy/unlock semantics

Founder direction:

```text
view -> free
first meaningful copy/unlock -> may cost
repeat copy after access -> should not repeatedly charge the same unlock
```

This implies durable user-product access state in the future.

Do not implement repeated billing from button-click count alone.

---

# 12. Creator monetization modes V1

Approved first set:

```text
FREE
ONE_TIME_PURCHASE
OWNERSHIP_TRANSFER
```

## Free

Used for reputation, portfolio, acquisition and community value.

## One-time purchase

Ordinary buyer gets access/use according to the product rules.

## Ownership transfer

The current owner can sell full product ownership. Successful transfer moves administrative/economic control to the buyer while preserving historical attribution/lineage.

Deferred:

- subscriptions;
- generic pay-per-use plans;
- recurring Creator memberships;
- multi-owner revenue splitting.

---

# 13. Marketplace commission

Prompt Draft should be Creator-first in experience but commercially meaningful as a marketplace business.

Base economic model:

```text
Product sale
  -> Creator share
  -> Prompt Draft commission
```

Exact percentage is not selected yet.

Founder direction:

> use a clear base commission, then reduce the platform commission for Creators who earn reputation/level rewards.

Example only (not approved numbers):

```text
base platform commission: 20%
higher Creator level: 15%
top level: 10%
```

The final table must be simple enough to understand without reading a complex contract.

---

# 14. Creator Level and gamification

Creator Level is an economic progression mechanism.

Primary effect in V1:

- lower platform commission.

Not intended in V1:

- different Creator-panel feature sets;
- hidden administrative privileges;
- guaranteed homepage ranking.

Visual levels/badges may exist for social trust.

Discovery ranking remains a separate algorithm.

---

# 15. Reputation signals

Final formula is intentionally not selected.

Possible inputs include:

- verified-user ratings;
- product usage;
- successful purchases;
- remix activity;
- conversion/context;
- consistency across Creator catalog;
- contribution/community signals.

Most reputation should be automatic.

Prompt Draft editorial recommendations remain a separate promotion surface.

---

# 16. Creator contract principle

Creator terms must be exceptionally clear.

The Creator should easily understand:

- what they own;
- what Prompt Draft retains;
- their price;
- platform commission;
- how level changes commission;
- remix permissions;
- ownership-transfer rules;
- payout/cash-out rules once enabled.

Complexity in Creator terms is treated as an acquisition risk.

---

# 17. Data/economy ownership

Commercial product knowledge remains Creator-owned according to platform terms.

Prompt Draft retains ownership/control of non-sellable platform intelligence, including anonymized/aggregate usage and market signals.

Creator removal of a commercial product does not delete platform-owned internal intelligence already generated from the ecosystem.

---

# 18. Investor/accelerator logic

The simulation economy is intended to produce stronger evidence than raw sign-up counts.

Useful evidence includes:

```text
units issued
units spent
spend frequency
time-to-first-spend
active buyers/users
Creator supply growth
product usage
repeat usage
referral contribution
circulation/velocity patterns
```

If meaningful circulation exists before fiat monetization, external capital can fund scaling a demonstrated loop rather than a purely theoretical marketplace.

---

# 19. Exact values intentionally unresolved

Do not hardcode strategic assumptions before the experiment.

Still open:

- internal unit name;
- conversion rate;
- initial supply/reward schedule;
- first-copy price policy;
- personalization cost;
- base commission percentage;
- commission discount tiers;
- cash-out threshold;
- payout schedule;
- anti-abuse/maturity windows;
- real-money activation date.

Analytics and real behavior should inform these choices.
