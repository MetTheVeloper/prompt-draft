import {
  validateBlogArticlePackage,
  type BlogArticle,
  type BlogArticleStatus,
  type BlogLocale,
  type BlogValidationIssue,
} from '../shared/blog-article'

export type ManageBlogDraft = {
  id: string
  slug: string
  status: BlogArticleStatus
  publishedAt: string
  updatedAt: string
  authorName: string
  authorUrl: string
  heroFullUrl: string
  heroThumbnailUrl: string
  heroWidth: string
  heroHeight: string
  enTitle: string
  enDescription: string
  enAlt: string
  enBody: string
  faTitle: string
  faDescription: string
  faAlt: string
  faBody: string
}

function nowIso() {
  return new Date().toISOString()
}

export function createEmptyManageBlogDraft(): ManageBlogDraft {
  return {
    id: '',
    slug: '',
    status: 'draft',
    publishedAt: '',
    updatedAt: nowIso(),
    authorName: 'Prompt Draft',
    authorUrl: '/',
    heroFullUrl: '',
    heroThumbnailUrl: '',
    heroWidth: '',
    heroHeight: '',
    enTitle: '',
    enDescription: '',
    enAlt: '',
    enBody: '',
    faTitle: '',
    faDescription: '',
    faAlt: '',
    faBody: '',
  }
}

export function blogArticleToManageDraft(article: BlogArticle): ManageBlogDraft {
  return {
    id: article.id,
    slug: article.slug,
    status: article.status,
    publishedAt: article.publishedAt ?? '',
    updatedAt: article.updatedAt,
    authorName: article.author.name,
    authorUrl: article.author.url ?? '',
    heroFullUrl: article.hero?.fullUrl ?? '',
    heroThumbnailUrl: article.hero?.thumbnailUrl ?? '',
    heroWidth: article.hero?.width ? String(article.hero.width) : '',
    heroHeight: article.hero?.height ? String(article.hero.height) : '',
    enTitle: article.localizations.en?.title ?? '',
    enDescription: article.localizations.en?.description ?? '',
    enAlt: article.hero?.alt.en ?? '',
    enBody: article.body.en ?? '',
    faTitle: article.localizations.fa?.title ?? '',
    faDescription: article.localizations.fa?.description ?? '',
    faAlt: article.hero?.alt.fa ?? '',
    faBody: article.body.fa ?? '',
  }
}

function dimension(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : trimmed
}

function localeHasInput(draft: ManageBlogDraft, locale: BlogLocale) {
  if (locale === 'en') {
    return Boolean(
      draft.enTitle.trim() ||
      draft.enDescription.trim() ||
      draft.enBody.trim() ||
      draft.enAlt.trim(),
    )
  }

  return Boolean(
    draft.faTitle.trim() ||
    draft.faDescription.trim() ||
    draft.faBody.trim() ||
    draft.faAlt.trim(),
  )
}

export function manageBlogDraftToPackage(draft: ManageBlogDraft) {
  const localizations: Record<string, { title: string; description: string }> = {}
  const body: Partial<Record<BlogLocale, string>> = {}
  const alt: Partial<Record<BlogLocale, string>> = {}

  if (localeHasInput(draft, 'en')) {
    localizations.en = {
      title: draft.enTitle,
      description: draft.enDescription,
    }
    body.en = draft.enBody
    if (draft.enAlt.trim()) alt.en = draft.enAlt
  }

  if (localeHasInput(draft, 'fa')) {
    localizations.fa = {
      title: draft.faTitle,
      description: draft.faDescription,
    }
    body.fa = draft.faBody
    if (draft.faAlt.trim()) alt.fa = draft.faAlt
  }

  const hasHero = Boolean(
    draft.heroFullUrl.trim() ||
    draft.heroThumbnailUrl.trim() ||
    draft.heroWidth.trim() ||
    draft.heroHeight.trim() ||
    draft.enAlt.trim() ||
    draft.faAlt.trim(),
  )

  return {
    metadata: {
      id: draft.id,
      slug: draft.slug,
      status: draft.status,
      publishedAt: draft.publishedAt.trim() || null,
      updatedAt: draft.updatedAt.trim(),
      author: {
        kind: 'editorial',
        name: draft.authorName,
        url: draft.authorUrl.trim() || null,
      },
      hero: hasHero
        ? {
            fullUrl: draft.heroFullUrl,
            thumbnailUrl: draft.heroThumbnailUrl.trim() || null,
            width: dimension(draft.heroWidth),
            height: dimension(draft.heroHeight),
            alt,
          }
        : null,
      localizations,
    },
    body,
  }
}

export function validateManageBlogDraft(draft: ManageBlogDraft): {
  ok: boolean
  issues: BlogValidationIssue[]
  article: BlogArticle | null
} {
  const pkg = manageBlogDraftToPackage(draft)
  const result = validateBlogArticlePackage({
    directoryId: draft.id.trim() || undefined,
    metadata: pkg.metadata,
    body: pkg.body,
  })

  return result.ok
    ? { ok: true, issues: [], article: result.article }
    : { ok: false, issues: result.issues, article: null }
}

export function touchManageBlogDraft(draft: ManageBlogDraft) {
  draft.updatedAt = nowIso()
  if (draft.status === 'published' && !draft.publishedAt.trim()) {
    draft.publishedAt = draft.updatedAt
  }
}
