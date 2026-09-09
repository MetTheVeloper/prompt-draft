# Prompt Draft Blog Content

This directory is the canonical repository-backed editorial source for Blog V1.

Each Article uses one stable directory identity independent from its public slug:

```text
content/blog/<articleId>/
  article.json
  en.md
  fa.md
```

`en.md` and `fa.md` are optional independently. A locale becomes public only when the Article is `published` and that locale has valid title, description and non-empty Markdown body.

`article.json` must contain exactly:

```json
{
  "id": "stable-article-id",
  "slug": "public-article-slug",
  "status": "draft",
  "publishedAt": null,
  "updatedAt": "2026-09-09T19:00:00.000Z",
  "author": {
    "kind": "editorial",
    "name": "Prompt Draft",
    "url": "/"
  },
  "hero": null,
  "localizations": {
    "en": {
      "title": "Article title",
      "description": "Article description"
    }
  }
}
```

If hero media is present, the shape is:

```json
{
  "fullUrl": "https://...",
  "thumbnailUrl": "https://...",
  "width": 1600,
  "height": 900,
  "alt": {
    "en": "Localized image alternative text",
    "fa": "متن جایگزین تصویر"
  }
}
```

Rules:

- Article ids and slugs use lowercase ASCII letters/numbers separated by single hyphens.
- The directory name must equal `article.json.id`.
- Slugs must be unique repository-wide.
- V1 author identity is explicit editorial/site identity only; never reference a private user id.
- Raw article bodies are Markdown only; metadata does not live in frontmatter.
- Markdown images/links may use root-relative or HTTP(S) URLs only.
- Do not embed `data:`/base64 image payloads in Markdown.
- Raw HTML is not trusted by the public renderer and is escaped.
- Tables are intentionally not part of the V1 Markdown contract.
- Do not add draft/unpublished Article URLs to sitemap or llms.txt.
- Git remains the canonical editorial source. Public requests must never query GitHub for this directory.
