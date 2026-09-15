const TELEGRAM_STATIC_ROUTES: Record<string, string> = {
  create: '/create',
  collage: '/collage',
  guide: '/guide',
}

export function resolveTelegramStartParam(startParam: string) {
  const promptMatch = /^prompt_(\d+)$/.exec(startParam)
  if (promptMatch) {
    return `/prompts?id=${encodeURIComponent(promptMatch[1])}`
  }

  const campaignMatch = /^campaign_([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(startParam)
  if (campaignMatch) {
    return `/campaign/${campaignMatch[1]}?source=telegram&medium=campaign_channel`
  }

  return TELEGRAM_STATIC_ROUTES[startParam]
}
