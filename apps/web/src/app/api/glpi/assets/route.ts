import { getContainer } from '@/lib/glpi/server/container'
import { assetInventory } from '@/lib/glpi/server/services/asset-inventory.service'
import { requireAuth, json, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const c = getContainer()
    requireAuth(req, c.jwt)
    return json(await assetInventory(c))
  } catch (err) {
    return toErrorResponse(err)
  }
}
