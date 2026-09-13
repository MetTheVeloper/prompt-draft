function freezeRegistry(entries) {
  return Object.freeze(Object.fromEntries(entries.map(entry => [entry.key, Object.freeze(entry)])))
}

export const CAMPAIGN_RENDERERS = freezeRegistry([
  { key: 'campaign-default-v1', kind: 'builtin' },
])

export const CAMPAIGN_MECHANICS = freezeRegistry([
  { key: 'metric_goal', trustModel: 'server_authoritative' },
  { key: 'task_list', trustModel: 'server_authoritative' },
  { key: 'custom_game', trustModel: 'server_verifiable' },
  { key: 'chance_wheel', trustModel: 'server_authoritative' },
  { key: 'custom', trustModel: 'client_reported' },
])

export const CAMPAIGN_METRICS = freezeRegistry([
  { key: 'referrals.completed.count', valueType: 'count', supportedWindows: ['lifetime','campaign','since_participation'] },
  { key: 'prompts.unlocked.count', valueType: 'count', supportedWindows: ['lifetime','campaign','since_participation'] },
  { key: 'drafts.public.count', valueType: 'count', supportedWindows: ['lifetime','campaign','since_participation'] },
  { key: 'prompts.created.count', valueType: 'count', supportedWindows: ['lifetime','campaign','since_participation'] },
])

export function getCampaignRenderer(key) { return CAMPAIGN_RENDERERS[key] ?? null }
export function getCampaignMechanic(key) { return CAMPAIGN_MECHANICS[key] ?? null }
export function getCampaignMetric(key) { return CAMPAIGN_METRICS[key] ?? null }
