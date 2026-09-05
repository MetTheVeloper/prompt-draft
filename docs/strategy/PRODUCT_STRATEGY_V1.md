# Prompt Draft — Product Strategy V1

Status: **Founder-approved strategic direction**

This document records the approved product direction derived from the founder-discovery discussion and the verified backend capability handoff.

---

# 1. Vision

Prompt Draft should become a reference platform for people who want to use AI effectively without needing to be prompt engineers themselves.

Image / Visual Creation is the first live proof of the concept, not the final scope.

Long-term, Prompt Draft should serve two connected groups:

1. **Consumers** who want to achieve a result with AI quickly and reliably.
2. **Creators / Prompt Engineers / AI specialists** who want to package, showcase and monetize reusable expertise.

The long-term product is not merely a prompt store. It is a platform where reusable AI knowledge can be structured, discovered, customized, combined, sold, remixed and evolved.

---

# 2. Core thesis

The difficult part of AI usage is often not access to a model. It is converting human intent into a structured instruction that produces a useful result.

Prompt Draft occupies the layer between human intent and external AI tools:

```text
Human intent
  -> reusable engineering knowledge
  -> structured Prompt Draft representation
  -> final prompt / instruction
  -> external AI tool
  -> result
```

Prompt Draft is not the final execution destination.

---

# 3. Product positioning

Prompt Draft should be understood as:

> a marketplace and intelligent workspace for reusable AI knowledge engineering.

The product sold today is usually represented as a prompt, but the underlying value is not the text itself. The value is the engineering knowledge, experience, strategy, decisions and structure embedded in it.

If the dominant human-to-AI interaction format changes in the future, Prompt Draft should be able to represent the same reusable expertise in a different form without losing its product identity.

---

# 4. What Prompt Draft is not

Prompt Draft is not intended to become:

- an AI model provider;
- a replacement for ChatGPT, Midjourney, Krea or similar execution tools;
- an image/video generation destination;
- a generic social network;
- a general AI academy;
- a project-management suite;
- an everything-app.

Growth should remain **horizontal** around the same core competency: structuring reusable knowledge for AI interaction across more domains.

---

# 5. Technical moat

The primary technical moat is the **Semantic Prompt Engine**.

The current Image / Visual Creation implementation proves a repeatable architecture:

```text
Domain understanding
  -> identify semantic elements
  -> create independent modules
  -> define wiring/relationships
  -> compile structured output
```

The founder expects the same engineering method to be reusable for future domains.

The system should not be reduced to free-form LLM text generation. Its value comes from explicit semantics, modularity, deterministic wiring and structured output.

---

# 6. Product primitives

The marketplace should support at least three first-class product types:

## Prompt

A structured, ready-to-use AI instruction.

## Template

A reusable prompt product with user-editable variables or controlled options. The buyer can customize the product on its own page and copy the finalized output without opening the full editor or creating a Draft.

Example variables:

- poster title;
- brand name;
- event date/time;
- product description;
- aspect ratio;
- style selection.

## Workflow

A larger knowledge product that explains a complete process and may contain multiple prompts, templates, instructions, media examples and supporting knowledge components.

Workflow pages should support rich editorial content, headings, structured explanations, examples, screenshots/assets and search-friendly educational content.

---

# 7. Composable knowledge model

The long-term marketplace is a marketplace of **composable knowledge components**, not only finished outputs.

The founder's core mental model is circuit-like:

```text
Knowledge module A
Knowledge module B
Knowledge module C
       \   |   /
        combined
           -> working system
```

Each component should remain locally understandable and not require tight coupling to every other component.

A workflow may use prompts, templates, guides or other reusable blocks. Products and components should be able to reference one another through a Content Graph.

---

# 8. Consumer experience

The default consumer experience should be **Intent First**.

A non-expert user should not need to understand prompt engineering or even think about prompt structure.

The target journey is:

```text
User need / intent
  -> lightweight wizard or guided discovery
  -> relevant product(s)
  -> minimum required customization
  -> finalized instruction
  -> copy / handoff to external AI tool
```

Prompt Draft should hide unnecessary engineering complexity while keeping the system transparent enough that users know when an AI assistant is making suggestions and that AI can make mistakes.

---

# 9. Personalization and discovery

The future homepage should become a personalized discovery surface rather than a static page.

Signals may include:

- explicit user interests;
- preferred domains;
- products viewed/used;
- products copied/remixed/shared;
- creators followed;
- related categories;
- similar creators;
- new content from followed creators.

Personalization should evolve from explicit preferences toward behavior-driven signals as real analytics data becomes available.

---

# 10. Creator identity

Creator identity is the primary network moat.

Prompt Draft should become a place a specialist is proud to use as a public reference:

> “See my work on Prompt Draft.”

A Creator profile should eventually support:

- identity and profile media;
- expertise;
- portfolio/catalog;
- published products;
- ratings/reputation;
- follow graph;
- monetization status;
- creator analytics.

Monetization is optional. A Creator may use Prompt Draft purely as a portfolio/catalog and never sell a product.

---

# 11. Community layer

Community is considered supportive horizontal infrastructure, not unwanted vertical expansion.

Users and Creators should eventually be able to follow Creators.

Follow relationships should contribute to:

- homepage personalization;
- creator discovery;
- new-product recommendations;
- category inference;
- community growth.

Multi-creator product ownership/collaboration is acknowledged as a future concern but is intentionally not designed in V1.

---

# 12. Marketplace philosophy

Prompt Draft is not a mandatory paywall and not a mandatory sales platform.

Creators may publish products:

- free;
- as one-time purchases;
- with full ownership-transfer availability.

The market should remain open and Creator pricing should remain free within platform rules.

Prompt Draft should provide market intelligence and guardrails, not dictate the final price.

---

# 13. Remix economy

Remix is a first-class future concept.

A Creator should be able to control whether a product may be remixed and republished.

When allowed, a derived product should preserve lineage and attribution to the source product.

Possible Creator-controlled rules include:

- remix allowed / disallowed;
- republishing allowed / disallowed;
- resale price restrictions;
- source-Creator revenue share from derived sales.

The platform should make improvement cooperative rather than purely competitive.

---

# 14. Content Graph and lineage

Prompt Draft should preserve relationships among:

- Creators;
- Products;
- Categories;
- Prompts;
- Templates;
- Workflows;
- Remixes;
- source products;
- related products;
- educational content.

Lineage should be visible to users where useful.

This does not require a graph database in the near term. PostgreSQL relations are acceptable as long as the product relationship model is explicit and extensible.

---

# 15. Execution Layer

Prompt Draft should not execute the final AI workload, but it should own the finalization layer before handoff.

Examples:

- change aspect ratio before copying an image prompt;
- fill template variables directly on the product page;
- choose controlled options;
- produce a finalized prompt without opening `/create`;
- provide tool-specific usage guidance where appropriate.

This Execution Layer is a major part of what the buyer pays for: reducing human effort between discovering knowledge and using it.

---

# 16. AI strategy

AI is an assistant to Prompt Draft's architecture, not a replacement for it.

Priority future uses:

## Structured semantic mapping

AI may interpret user intent and propose values for existing modules/fields when the fixed option catalog is insufficient.

The AI output should map into Prompt Draft semantics rather than replacing the system with free-form text.

## Dynamic Wizard

Future Wizards may generate the next step dynamically based on the current user state while operating only through validated Prompt Draft schemas/actions.

## Internal AI

Structured data produced by real usage may eventually train or improve a Prompt Draft-owned assistant/model.

AI quality-scoring of products is possible but is not currently a priority.

---

# 17. Data ownership

The founder-approved principle is:

> Creator owns the sellable knowledge product. Prompt Draft owns the non-sellable platform intelligence generated by the ecosystem.

Creator-controlled/sellable data includes the product's commercial knowledge/content and assets.

Prompt Draft-retained intelligence includes, where legally and technically appropriate:

- usage events;
- aggregate behavior;
- ranking signals;
- conversion patterns;
- anonymized learning patterns;
- Content Graph relationships;
- recommendation features;
- platform analytics.

Deleting or unpublishing a Creator's commercial product does not require deleting Prompt Draft-owned internal intelligence already generated from platform activity.

Long-term analysis/training should use anonymized/aggregated data where appropriate and this policy must be disclosed transparently.

---

# 18. Trust and quality

Prompt Draft is not the absolute gatekeeper of marketplace quality.

The market should provide the primary quality signals through:

- ratings/reviews from real users;
- usage;
- copies;
- remixes;
- conversion;
- creator history;
- product performance.

Prompt Draft may provide separate editorial promotion such as:

- Prompt Draft Picks;
- expert recommendations;
- featured products.

Editorial promotion must not silently manipulate objective rankings such as Most Viewed or Best Rated.

The platform may be a gatekeeper of **promotion**, not the sole gatekeeper of quality.

---

# 19. Creator reputation and levels

Most Creator reputation should be calculated automatically from real market behavior.

Creator Level should have one primary economic effect:

> higher reputation may reduce Prompt Draft's commission rate.

Levels/badges should not create different Admin/Creator-panel feature sets in V1.

Homepage/discovery ranking must remain a separate system rather than automatically favoring higher-level Creators.

The Creator contract and commission rules should be one of the clearest and least ambiguous parts of the product.

---

# 20. Internal economy

Prompt Draft should use a virtual internal economy rather than a cryptocurrency or legally tradable token.

The founder wants a coin/credit-like unit that behaves as the internal unit of exchange and incentive.

Key principles:

- not blockchain;
- not an investment asset;
- not an external freely traded token;
- transactions inside Prompt Draft use the internal unit;
- users may earn it from selected actions/campaigns;
- users spend it when extracting meaningful value;
- Creators receive value from sales;
- the platform takes a commission.

The current XP ledger is a reusable technical foundation but is not yet the final commercial wallet semantics.

The first economic phase should be a simulation: distribute units through activity/referral/giveaway-style mechanisms, observe circulation, and only later activate real-money purchase/conversion if the loop works.

---

# 21. Pricing philosophy

Price should primarily follow **value created**, not product type or implementation complexity.

Product type provides context/baseline only.

Creators remain free to set prices.

Prompt Draft should provide pricing intelligence based on genuinely comparable products, separated by product type/category where possible, including signals such as:

- average price;
- median price;
- lowest observed price;
- highest observed price;
- relevant conversion context.

Bad pricing should normally be corrected by the market rather than prohibited by the platform.

---

# 22. Monetization models V1

V1 Creator product monetization models:

1. **Free**
2. **One-time purchase**
3. **Full product ownership transfer**

Subscriptions and pay-per-use models are intentionally deferred.

Normal purchase gives usage/access according to the product's permissions.

Full ownership transfer moves product control to the buyer, including future product management and future economic benefit, while historical attribution/lineage remains preserved.

---

# 23. Commission model

Prompt Draft should present itself and behave as Creator-first while maintaining a financially attractive marketplace business model.

Base model:

```text
sale
  -> Creator share
  -> Prompt Draft commission
```

Commission starts from a clear base rate and may be reduced by Creator-level/reputation rewards.

This provides gamification without creating opaque contract complexity.

---

# 24. Growth strategy

The first major strategic phase is Growth Foundation.

Primary growth hypotheses:

- referral loop using the existing referral foundation;
- SEO and public searchable content;
- Creator-led distribution;
- personalized discovery;
- internal-economy experimentation.

Paid acquisition is not the primary early hypothesis.

The goal is to produce evidence that the product can attract, engage and retain users before large Marketplace investment.

---

# 25. Domain expansion

After Growth Foundation, validate the Semantic Prompt Engine outside Image / Visual Creation.

Current priority hypothesis:

```text
1. Content Creation
2. Programming
3. Education
4. Marketing / Advertising
```

The taxonomy itself should remain open and market-driven.

Creators may eventually introduce new categories/domains that can later become official taxonomy based on observed demand.

---

# 26. Architecture direction

Current verified deployment:

```text
static-generated Nuxt frontend
  -> direct browser HTTP/CORS
  -> independent Node API
  -> PostgreSQL
  -> Arvan Object Storage
```

This architecture remains valid for the current phase and should not be replaced merely because future Marketplace scale is anticipated.

However, the public marketplace will eventually require an explicit rendering/deployment decision for large-scale SEO-friendly dynamic pages.

Future architecture review should compare:

- static prerendering;
- incremental/static regeneration;
- SSR;
- hybrid rendering.

The likely long-term direction is a hybrid model where public knowledge pages are server/prerender optimized while private application surfaces remain client-heavy.

This is an architecture decision to prepare for, not an immediate migration requirement.

---

# 27. Success metrics

The founder's three primary Year-1 ecosystem KPIs are:

1. **Creator count**
2. **Prompt/product usage**, explicitly broken down by actions such as copy, remix and copy-page-link/share
3. **Product count**

Revenue matters, but the first proof is that the ecosystem creates and circulates value.

---

# 28. Biggest strategic risk

The founder identifies the largest internal risk as:

> failure to attract Creators.

Without Creators there is no growing supply, identity network or marketplace moat.

---

# 29. Founder principles

## Quality before uncontrolled scale

Prompt Draft should grow more slowly rather than sacrifice engineering identity and product quality for superficial speed.

## Market-led quality

The platform provides trust and promotion tools; real user behavior determines the primary quality signals.

## Reuse existing platform primitives

Before building a Growth, Credit, Referral, Creator or Marketplace capability, audit the existing backend and extend what already exists when the semantics match.

## Horizontal expansion

Grow the number of domains/generators using the same semantic-engine competency rather than becoming a collection of unrelated AI tools.

## Reusability North Star

Founder's decision rule:

> «آیا این تجربه قابلیت ری‌یوز دارد؟ اگه داره تجربه‌مو می‌فروشم.»

The core product opportunity is to turn reusable experience into a structured sellable asset.
