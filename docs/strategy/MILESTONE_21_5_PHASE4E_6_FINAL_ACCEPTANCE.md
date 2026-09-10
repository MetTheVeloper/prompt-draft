# Milestone 21.5 — Phase 4E.6 Blog V1 Final Acceptance

Status: **DONE / FOUNDER VERIFIED / ACCEPTED**

Date: 2026-09-10

Branch:

```text
feature/growth-foundation
```

Accepted dependencies:

```text
4E.1 Article Contract + Repository Loader -> ACCEPTED
4E.2 Public Blog SSR + SEO                 -> ACCEPTED
4E.3 Blog Inventory / Sitemap / llms       -> ACCEPTED
4E.4 Blog Management Authoring             -> ACCEPTED
4E.5 Blog Media + Git Publication          -> ACCEPTED
```

## 1. Purpose

4E.6 is the aggregate acceptance pass for Blog V1. It adds no new product capability. Its job is to prove that the accepted Blog slices coexist with the already accepted Phase 4A–4D public/SEO architecture and that local, static and external staging delivery all preserve the locked contracts.

## 2. Time-first verification scope

The 4E.6 harness itself changes only:

```text
scripts/**
package.json
docs/**
```

No Docker rebuild was required for the final harness acceptance pass. Runtime-source fixes discovered by the static gate were limited to the legacy-static Blog loader/build path and were verified with the narrow Blog contract/static gates before the final aggregate rerun.

## 3. Aggregate regression gate — PASS

Root command:

```powershell
pnpm test:phase4e-final
```

Accepted 2026-09-10. The aggregate gate reran the accepted Phase 4A–4D baseline plus all Blog contract/public/inventory/manage/media/publication suites and finished with:

```text
[phase4e-final] PASS: Phase 4A–4D baseline and all Blog contract/public/inventory/manage/media/publication regressions passed.
```

Observed Blog sub-suite evidence in the final pass:

```text
Blog Article contract/runtime loader        -> 20/20 PASS
Public Blog SSR + SEO + projection          -> 28/28 PASS
Blog sitemap / llms / inventory integration -> 19/19 PASS
Blog management authorization + authoring   -> 46/46 PASS
Managed Blog media + Gallery authoring       -> 15/15 PASS
Canonical Git publication + audit            -> 14/14 PASS
```

## 4. External staging gate — PASS

Root command:

```powershell
pnpm smoke:phase4e-final
```

Accepted staging target:

```text
https://grassic.ir
```

The smoke preserved the accepted external 4D baseline and Blog-specific behavior including public Blog API/index behavior, staging global noindex, canonical/hreflang, 404 behavior and public/private projection boundaries. `prompt-draft.ir` was not targeted.

## 5. Deterministic positive published-Article static gate — PASS

Root command:

```powershell
pnpm verify:phase4e-static
```

The canonical repository intentionally contains no temporary smoke Article after 4E.5. Positive published Article static behavior is therefore tested with an untracked deterministic fixture created only for the verification run:

```text
content/blog/phase4e-final-published-fixture/
  article.json
  en.md
  fa.md
```

The accepted final run proved:

```text
/blog/phase4e-final-published-fixture     -> prerendered successfully
/fa/blog/phase4e-final-published-fixture  -> prerendered successfully
BlogPosting JSON-LD                      -> PASS
localized canonical URLs                 -> PASS
sitemap inclusion                        -> PASS
llms.txt inclusion                       -> PASS
indexing-enabled static output noindex   -> absent as required
```

Final static evidence:

```text
Expected canonical URL count: 224
Published Blog Article inventory: 1
Blog index HTML checked: 2
Blog Article HTML checked: 2
phase4e-static PASS
Temporary fixture removed from content/blog
```

The static gate exposed and resolved two real legacy-static gaps before acceptance:

1. dynamic Blog Article routes were not guaranteed in the explicit prerender route set;
2. the static prerender runtime needed the validated build-workspace `content/blog` snapshot rather than relying only on Nitro `assets:blog`.

The final architecture keeps normal Docker/Nitro public runtime on bundled `assets:blog`, while `NUXT_LEGACY_STATIC_GENERATE=true` reads the same validated repository snapshot from the build workspace. No request-time GitHub dependency was introduced.

## 6. Positive SSR coverage model

Accepted positive published Article coverage is intentionally split across deterministic layers rather than keeping fake content in the canonical branch:

```text
shared/public projection tests -> published Article projection behavior
SSR/SEO contract tests         -> native Blog detail ownership + BlogPosting path
4E.5 runtime proof             -> real Git publish/update/unpublish workflow
4E.6 static fixture            -> generated EN/FA published Article HTML + inventory inclusion
staging smoke                  -> real deployed noindex/canonical/404 behavior
```

## 7. Final acceptance observations

```text
pnpm test:phase4e-final   -> PASS
pnpm smoke:phase4e-final  -> PASS
pnpm verify:phase4e-static -> PASS
content/blog fixture cleanup -> PASS / clean
staging remains globally noindex -> PASS
prompt-draft.ir untouched -> PASS
founder explicit acceptance -> PASS
```

Warnings emitted during Nuxt generation about duplicate auto-import names, sourcemaps and large chunks are non-blocking build warnings and did not fail the accepted Blog/static contracts.

## 8. Completion effect

```text
Phase 4E Blog V1 -> DONE / FOUNDER VERIFIED / ACCEPTED 2026-09-10
Next -> Phase 4F Integration / Verification / Legacy Retirement
```

4F may now begin. Phase 4E must not be reopened casually; follow-up preview/presentation polish can be scheduled as an independent UI slice unless it changes an accepted Blog contract.
