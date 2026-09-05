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
  telegramUrl: string | null
  model: {
    previewGeneratedWith: PromptArchiveModel
    optimizedFor: PromptArchiveModel[]
  }
  tags: string[]
  coverImage: PromptArchiveImage | null
  secondaryImage: PromptArchiveImage | null
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
  tags?: string[]
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

// Legacy V2 snapshot contract. This remains migration/backward-compatible input only.
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

export type PromptArchiveSnapshotItem = {
  id: number
  title: PromptArchiveLocalizedTitle
  sourceTitle: string
  publishedAt: string
  telegramUrl: string | null
  model: {
    previewGeneratedWith: PromptArchiveModel
    optimizedFor: PromptArchiveModel[]
  }
  images: PromptArchiveImage[]
  prompt: string
  tags: string[]
  variants: PromptArchiveVariant[]
}

export type PromptArchiveModelHistoryItem = {
  fromMessageId: number
  toMessageId?: number
  announcementMessageId?: number
  announcedAt?: string
  previewGeneratedWith: PromptArchiveModel
  optimizedFor: PromptArchiveModel[]
}

export type PromptArchiveLegacyPayload = {
  schemaVersion: number
  channel: string
  updatedAt: string
  modelHistory: PromptArchiveModelHistoryItem[]
  items: PromptArchiveLegacyItem[]
}

export type PromptArchiveSnapshotPayload = {
  schemaVersion: 3
  channel: string
  updatedAt: string
  modelHistory: PromptArchiveModelHistoryItem[]
  items: PromptArchiveSnapshotItem[]
}

export type PromptArchivePayload = PromptArchiveLegacyPayload | PromptArchiveSnapshotPayload
