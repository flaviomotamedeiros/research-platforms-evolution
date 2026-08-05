import type { Asset } from './asset.js'

export interface AssetRepository {
  findById(id: string): Promise<Asset | null>
  findByEntity(entityId: string): Promise<Asset[]>
  save(asset: Asset): Promise<void>
}
