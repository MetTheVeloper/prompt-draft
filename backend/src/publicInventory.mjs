import { handleCampaignActionsRequest } from './campaignRuntimeActionsRoute.mjs'
import { handleCampaignRuntimeRequest } from './campaignRuntimeRoute.mjs'
import { handlePublicInventoryRequest as handleCatalogInventoryRequest } from './publicInventoryCatalog.mjs'

export async function handlePublicInventoryRequest(context) {
  if (await handleCampaignActionsRequest(context)) return true
  if (await handleCampaignRuntimeRequest(context)) return true
  return handleCatalogInventoryRequest(context)
}

export {
  mapPublicInventoryCreator,
  mapPublicInventoryPrompt,
  readPublicInventory,
} from './publicInventoryCatalog.mjs'
