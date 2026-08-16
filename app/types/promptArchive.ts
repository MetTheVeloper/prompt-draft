export type PromptArchiveModel = 'dall-e' | 'gpt-image-1'

export type PromptArchiveVariant = {
  key: string
  label: {
    fa: string
    en: string
  }
  prompt: string
}

export type PromptArchiveItem = {
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
  items: PromptArchiveItem[]
}
