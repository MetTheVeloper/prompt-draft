import { handleCampaignRuntimeRequest } from './campaignRuntimeRoute.mjs'
import { handlePublicInventoryRequest as handleCatalogInventoryRequest } from './publicInventoryCatalog.mjs'

// Keep the index-level dispatch contract stable while Campaign Runtime is added.
// This module now acts as the public-resource dispatch boundary for Campaign and
// the existing SEO inventory endpoint; the inventory implementation itself is
// preserved byte-for-byte in publicInventoryCatalog.mjs.
export async function handlePublicInventoryRequest(context) {
  if (await handleCampaignRuntimeRequest(context)) return true
  return handleCatalogInventoryRequest(context)
}

export {
  mapPublicInventoryCreator,
  mapPublicInventoryPrompt,
  readPublicInventory,
} from './publicInventoryCatalog.mjs'
