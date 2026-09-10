# Milestone 21.5 — Phase 4E.6 Blog V1 Final Acceptance

Status: **IMPLEMENTED / VERIFICATION NEXT / NOT ACCEPTED**

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

The 4E.6 implementation itself changes only:

```text
scripts/**
package.json
docs/**
```

It does not change frontend application source, backend runtime source, Dockerfiles, Compose topology, SQL or production configuration.

Therefore the default verification for this slice is:

```text
no Docker rebuild
```

Existing accepted/running services are used by the aggregate and static checks. Rebuild only if a failing gate proves that runtime source/images are stale or a later fix changes runtime code.

## 3. Aggregate regression gate

Root command:

```powershell
pnpm test:phase4e-final
```

This runs, in order:

```text
accepted Phase 4A–4D aggregate regression
Blog Article contract/runtime loader
Public Blog SSR/SEO/projection
Blog inventory/sitemap/llms integration
Blog management authorization/authoring
managed Blog media/Gallery
canonical Git publication/audit
```

The command intentionally performs no Docker rebuild.

## 4. External staging gate

Root command:

```powershell
pnpm smoke:phase4e-final
```

Default target:

```text
https://grassic.ir
```

It refuses to target `prompt-draft.ir`.

The staging smoke first reruns the accepted 4D external baseline and then verifies Blog-specific behavior:

```text
/api/public/blog?locale=en|fa -> 200 + public-safe projection
/blog + /fa/blog -> 200
staging X-Robots-Tag noindex preserved
canonical + reciprocal hreflang preserved
CollectionPage + ItemList structured data present
missing Blog detail -> 404
removed publication-smoke slug -> 404
no protected/private serialized fields
```

If staging has a real published Blog Article, a representative EN/FA detail is also checked for 200, canonical, BlogPosting and noindex.

If staging intentionally has no published Article, positive published-detail rendering is not silently waived; it is mandatory in the deterministic static fixture gate below.

## 5. Deterministic positive published-Article static gate

Root command:

```powershell
pnpm verify:phase4e-static
```

The canonical repository intentionally contains no temporary smoke Article after 4E.5. To prove positive published Article static behavior without publishing fake content, this command creates an untracked deterministic fixture only for the duration of verification:

```text
content/blog/phase4e-final-published-fixture/
  article.json
  en.md
  fa.md
```

The wrapper then runs the accepted Blog static verifier, which itself performs one production-like `pnpm generate` against the running local public inventory API.

The final gate explicitly verifies generated EN + FA Article HTML for:

```text
200-equivalent generated route presence
localized fixture title
BlogPosting JSON-LD
canonical URL
no inherited noindex in indexing-enabled static output
sitemap inclusion
llms.txt inclusion
```

The fixture directory is removed in a `finally` block whether verification passes or fails. It is never committed and must never be deployed.

## 6. Positive SSR coverage model

4E.6 intentionally splits positive published Article coverage across deterministic tests rather than keeping a fake Article in the canonical branch:

```text
shared/public projection tests -> published Article projection behavior
SSR/SEO contract tests         -> native Blog detail route ownership and BlogPosting path
4E.5 runtime proof             -> real Git publish/update/unpublish workflow
4E.6 static fixture            -> generated EN/FA published Article HTML + inventory inclusion
staging smoke                  -> real deployed noindex/canonical/404 behavior
```

Once a real production-intended Blog Article exists on staging, the same staging smoke automatically exercises the positive detail case as well.

## 7. Acceptance requirements

4E.6 can be accepted only when all three root gates pass:

```text
pnpm test:phase4e-final
pnpm smoke:phase4e-final
pnpm verify:phase4e-static
```

Additional required observations:

```text
no temporary fixture remains in content/blog after static verification
grassic.ir remains globally noindex
prompt-draft.ir was never targeted
no unexpected rebuild was required
```

Explicit founder acceptance is required after evidence is reviewed.

## 8. Completion effect

When 4E.6 is accepted:

```text
Phase 4E Blog V1 -> DONE / ACCEPTED
Next -> Phase 4F Integration / Legacy Retirement
```

Do not start 4F cleanup/retirement before 4E is explicitly closed.
