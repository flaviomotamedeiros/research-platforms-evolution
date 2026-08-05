import type { SpecField } from '@rpe/plugin-sdk'
import type { Container } from '../container'

export interface InventoryItem {
  id: string
  name: string
  status: string
  serialNumber: string
  assignedTo: string | null
  type: { id: string; displayName: string; icon: string }
  spec: SpecField[]
}

/**
 * Asset inventory view. The core stores an opaque spec payload per asset and
 * resolves the asset-type plugin from the registry to describe it — the core
 * never parses computer/network/printer specifics itself.
 */
export async function assetInventory(c: Container): Promise<InventoryItem[]> {
  const assets = await c.prisma.asset.findMany({ orderBy: { name: 'asc' } })
  const userIds = assets.map((a) => a.assignedToUserId).filter(Boolean) as string[]
  const users = await c.prisma.user.findMany({ where: { id: { in: userIds } } })
  const nameOf = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]))

  return assets.map((a) => {
    const plugin = c.plugins.getAssetType(a.typePluginId)
    return {
      id: a.id,
      name: a.name,
      status: a.status,
      serialNumber: a.serialNumber,
      assignedTo: a.assignedToUserId ? nameOf.get(a.assignedToUserId) ?? null : null,
      type: plugin
        ? { id: plugin.metadata.id, displayName: plugin.displayName, icon: plugin.icon }
        : { id: a.typePluginId, displayName: a.typePluginId, icon: '📦' },
      spec: plugin ? plugin.describe(a.spec) : [],
    }
  })
}
