import { handleAdminCampaignRoute } from './adminCampaignRoute.mjs'
import { handleAdminCampaignMeasurementRoute } from './adminCampaignMeasurementRoute.mjs'

export async function handleCampaignAdminRequest(context) {
  if (await handleAdminCampaignMeasurementRoute(context)) return true
  return handleAdminCampaignRoute(context)
}
