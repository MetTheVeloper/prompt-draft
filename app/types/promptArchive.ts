export type PromptArchiveModel = 'dall-e' | 'gpt-image-1'

export type PromptArchiveLocalizedTitle = {
  en: string
  fa: string
}

export type PromptArchiveVariant = {
  key: string
  label: {
    fa: string
    en: string
  }
  prompt: string
}

export type PromptArchiveImage = {
  position: number
  fullUrl: string
  thumbnailUrl: string
}

export type PromptArchiveListItem = {
  id: number
  title: PromptArchiveLocalizedTitle
  publishedAt: string
  telegramUrl: string
  model: {
    previewGeneratedWith: PromptArchiveModel
    optimizedFor: PromptArchiveModel[]
  }
  tags: string[]
  coverImage: PromptArchiveImage | null
  imageCount: number
}

export type PromptArchiveNavigationItem = {
  id: number
  title: PromptArchiveLocalizedTitle
}

export type PromptArchiveDetailItem = PromptArchiveListItem & {
  sourceTitle: string
  prompt: string
  images: PromptArchiveImage[]
  variants: PromptArchiveVariant[]
}

export type PromptArchiveListQuery = {
  limit?: number
  cursor?: string | null
  search?: string
  model?: PromptArchiveModel | null
  tag?: string | null
  sort?: 'newest' | 'oldest'
}

export type PromptArchiveListResponse = {
  ok: true
  items: PromptArchiveListItem[]
  totalCount: number
  hasMore: boolean
  nextCursor: string | null
  availableTags: string[]
}

export type PromptArchiveDetailResponse = {
  ok: true
  item: PromptArchiveDetailItem
  previousItem: PromptArchiveNavigationItem | null
  nextItem: PromptArchiveNavigationItem | null
}

export type PromptArchiveReadSource = 'api' | 'fallback'

// Legacy V2 snapshot contract. This remains migration/fallback input only;
// Prompt Archive UI consumes the normalized contracts above.
export type PromptArchiveLegacyItem = {
  id: number
  titleKey: string
  sourceTitle: string
  publishedAt: string
  telegramUrl: string
  model: {
    previewGeneratedWith: PromptArchiveModel
    optimizedFor: PromptArchiveModel[]
  }
  images: string[]
  prompt: string
  tags: string[]
  variants?: PromptArchiveVariant[]
}

export type PromptArchiveModelHistoryItem = {
  fromMessageId: number
  toMessageId?: number
  announcementMessageId?: number
  announcedAt?: string
  previewGeneratedWith: PromptArchiveModel
  optimizedFor: PromptArchiveModel[]
}

export type PromptArchivePayload = {
  schemaVersion: number
  channel: string
  updatedAt: string
  modelHistory: PromptArchiveModelHistoryItem[]
  items: PromptArchiveLegacyItem[]
}
