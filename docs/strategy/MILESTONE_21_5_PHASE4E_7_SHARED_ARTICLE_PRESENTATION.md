# Milestone 21.5 — Phase 4E.7 Shared Article Presentation

Status: **IMPLEMENTED / FOUNDER UI VERIFICATION NEXT / NOT ACCEPTED**

Date: 2026-09-10

Branch:

```text
feature/growth-foundation
```

## Purpose

4E.7 is a founder-requested final UI addendum after the accepted 4E.6 aggregate gate. It does not change Article identity, authorization, Git publication, public inventory, localization eligibility, sitemap/llms policy or public/private boundaries.

Its purpose is to make Blog Article presentation one shared contract across authoring preview and public reading surfaces.

## Shared presentation contract

The canonical body renderer remains the existing safe Markdown pipeline:

```text
renderPublicMarkdown
-> renderPublicBlogMarkdown
-> BlogArticlePresentation
```

No second Markdown engine or sanitizer is introduced.

Both surfaces must render the same component:

```text
/manage/blog Markdown preview -> BlogArticlePresentation
/blog/:slug public body       -> BlogArticlePresentation
/fa/blog/:slug public body    -> BlogArticlePresentation
```

This guarantees that typography, sections, quotes, code, lists, links and inline images are owned by one presentation layer.

## Collapsible heading sections

Blog Markdown headings are projected into hierarchical native disclosure sections using semantic `<details>/<summary>` output generated only from already-safe Blog Markdown HTML.

Rules:

```text
content before the first heading remains visible intro content
each heading starts one collapsible section
lower-level headings nest under the nearest higher-level heading
collapsing a parent collapses its nested subsections visually
all sections are expanded by default
heading elements remain present in SSR HTML
```

Native disclosure elements are intentionally used as semantic browser primitives; visual treatment comes from Prompt Draft theme tokens and the shared component.

## Typography / rich content

`BlogArticlePresentation` centrally owns presentation for:

```text
body paragraphs
h2-h6
strong / emphasis
ordered + unordered lists
links
blockquote
inline code
fenced code blocks
horizontal rules
inline Article images
```

Styling uses Prompt Draft theme variables only. Rich-text descendant CSS is an explicit exception allowed by `UI_IMPLEMENTATION_GUIDELINES.md` because these nodes are sanitized `v-html` render output rather than ordinary application controls.

The previously accepted Article image presentation cap remains:

```text
max-width: min(100%, 400px)
max-height: 400px
object-fit: contain
```

## Image lightbox

Inline Blog images are marked as interactive only in the Blog renderer and are keyboard focusable. Hover uses `cursor: zoom-in`.

Click, Enter or Space opens the image through the existing global `useModal` stack. There is no page-local fixed overlay or duplicate modal shell.

Shared pieces:

```text
BlogArticlePresentation
BlogZoomableImage
useBlogImageLightbox
BlogImageLightboxModal
```

Public Hero media uses the same lightbox workflow. The modal uses the project global shell, theme, backdrop, Escape handling and close lifecycle. The image itself is a native render sink inside Prompt Draft layout primitives.

## Non-goals

4E.7 does not change:

```text
Markdown authoring grammar
Article metadata contract
Git writer
publishedAt / updatedAt ownership
Blog public API
SEO metadata or BlogPosting schema
sitemap / llms eligibility
staging noindex
media upload/storage
```

## Verification

Focused gates:

```powershell
pnpm test:blog-contract
pnpm test:blog-public
pnpm test:blog-manage
pnpm test:blog-media
pnpm frontend
```

Founder UI smoke must verify EN + FA and Light + Dark where practical:

```text
Manage preview and public Article body are visually identical for the same Markdown
H2/H3 hierarchy collapses and expands correctly
parent collapse hides nested subsection content
paragraph/list/quote/code/link typography is readable
inline image cap remains correct
inline image hover shows zoom cursor
inline image click opens global image modal
keyboard Enter/Space opens focused inline image
public Hero image opens the same modal
modal closes by close button / Escape / backdrop
RTL presentation remains correct
```

Because this slice changes frontend application source, the smallest runtime rebuild is:

```powershell
pnpm frontend
```

No API rebuild or full stack rebuild is required.

## Acceptance effect

4E.1–4E.6 remain historically accepted. While this addendum is open:

```text
Phase 4E -> REOPENED FOR FINAL UI ADDENDUM
4E.7 -> IMPLEMENTED / FOUNDER UI VERIFICATION NEXT / NOT ACCEPTED
4F -> BLOCKED UNTIL 4E.7 ACCEPTANCE
```

After founder verification and explicit acceptance:

```text
4E.7 -> DONE / FOUNDER VERIFIED / ACCEPTED
Phase 4E -> DONE / ACCEPTED again
4F -> NEXT
```
