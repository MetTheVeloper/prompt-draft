function freezeRegistry(entries) {
  return Object.freeze(Object.fromEntries(entries.map(entry => [entry.key, Object.freeze(entry)])))
}

export const CAMPAIGN_PROMOTION_SLOTS = Object.freeze([
  'site_header',
  'floating_corner',
  'modal',
  'dashboard_banner',
])

export const CAMPAIGN_PROMOTION_RENDERERS = freezeRegistry([
  { key: 'header-campaign-cta-v1', kind: 'builtin', slots: Object.freeze(['site_header']) },
  { key: 'floating-campaign-card-v1', kind: 'builtin', slots: Object.freeze(['floating_corner']) },
  { key: 'campaign-modal-v1', kind: 'builtin', slots: Object.freeze(['modal']) },
  { key: 'dashboard-campaign-banner-v1', kind: 'builtin', slots: Object.freeze(['dashboard_banner']) },
])

export function getCampaignPromotionRenderer(key) {
  return CAMPAIGN_PROMOTION_RENDERERS[key] ?? null
}

export function isCampaignPromotionSlot(value) {
  return CAMPAIGN_PROMOTION_SLOTS.includes(value)
}
