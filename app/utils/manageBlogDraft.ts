import {
  validateBlogArticlePackage,
  type BlogArticle,
  type BlogArticleStatus,
  type BlogLocale,
  type BlogValidationIssue,
} from '../shared/blog-article'
import {
  BLOG_SYSTEM_AUTHOR,
  type ManageBlogWriteInput,
} from '../shared/manage-blog'

export type ManageBlogDraft = {
  id: string
  slug: string
  status: BlogArticleStatus
  publishedAt: string
  updatedAt: string
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

export function deriveManageBlogDraftId(draft: Pick<ManageBlogDraft, 'id' | 'slug'>) {
  const canonicalId = draft.id.trim()
  if (canonicalId) return canonicalId

  // Local validation needs a deterministic directory candidate before the first
  // canonical save. The Git writer owns collision resolution and final identity.
  return draft.slug.trim()
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

function effectiveUpdatedAt(draft: ManageBlogDraft) {
  return draft.updatedAt.trim() || nowIso()
}

function effectivePublishedAt(draft: ManageBlogDraft, updatedAt: string) {
  const existing = draft.publishedAt.trim()
  if (existing) return existing
  return draft.status === 'published' ? updatedAt : null
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
    draft.heroHeight.trim(),
  )

  const updatedAt = effectiveUpdatedAt(draft)

  return {
    metadata: {
      id: deriveManageBlogDraftId(draft),
      slug: draft.slug,
      status: draft.status,
      publishedAt: effectivePublishedAt(draft, updatedAt),
      updatedAt,
      author: { ...BLOG_SYSTEM_AUTHOR },
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

export function manageBlogDraftToWriteInput(
  draft: ManageBlogDraft,
  expectedVersion: string | null,
): ManageBlogWriteInput {
  const pkg = manageBlogDraftToPackage(draft)

  return {
    expectedVersion,
    slug: draft.slug,
    status: draft.status,
    hero: pkg.metadata.hero,
    localizations: pkg.metadata.localizations,
    body: pkg.body,
  }
}

export function validateManageBlogDraft(draft: ManageBlogDraft): {
  ok: boolean
  issues: BlogValidationIssue[]
  article: BlogArticle | null
} {
  const pkg = manageBlogDraftToPackage(draft)
  const directoryId = draft.id.trim() || undefined
  const result = validateBlogArticlePackage({
    directoryId,
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
