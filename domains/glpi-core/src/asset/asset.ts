import { AggregateRoot, BaseDomainEvent, fail, ok, type Result } from '@rpe/domain-kit'

export class AssetRegistered extends BaseDomainEvent {
  constructor(readonly assetId: string, readonly assetType: string) {
    super('asset.registered', assetId)
  }
}

export class AssetStatusChanged extends BaseDomainEvent {
  constructor(readonly assetId: string, readonly previous: AssetStatus, readonly next: AssetStatus) {
    super('asset.status_changed', assetId)
  }
}

/** Which asset-type plugin owns this asset's specification (asset_computer, …). */
export type AssetStatus = 'in_use' | 'spare' | 'repair' | 'retired'

export interface AssetProps {
  name: string
  typePluginId: string
  status: AssetStatus
  serialNumber: string
  entityId: string
  assignedToUserId?: string
  /** Opaque spec payload owned by the asset-type plugin. */
  spec: string
}

export type AssetError = 'NAME_REQUIRED' | 'SERIAL_REQUIRED' | 'ALREADY_RETIRED'

export class Asset extends AggregateRoot {
  private constructor(id: string, private props: AssetProps) {
    super(id)
  }

  static create(id: string, props: AssetProps): Result<Asset, AssetError> {
    if (!props.name.trim()) return fail('NAME_REQUIRED')
    if (!props.serialNumber.trim()) return fail('SERIAL_REQUIRED')
    const asset = new Asset(id, props)
    asset.emit(new AssetRegistered(id, props.typePluginId))
    return ok(asset)
  }

  static reconstitute(id: string, props: AssetProps): Asset {
    return new Asset(id, props)
  }

  get name(): string { return this.props.name }
  get typePluginId(): string { return this.props.typePluginId }
  get status(): AssetStatus { return this.props.status }
  get serialNumber(): string { return this.props.serialNumber }
  get entityId(): string { return this.props.entityId }
  get assignedToUserId(): string | undefined { return this.props.assignedToUserId }
  get spec(): string { return this.props.spec }

  changeStatus(next: AssetStatus): Result<void, AssetError> {
    if (this.props.status === 'retired') return fail('ALREADY_RETIRED')
    const previous = this.props.status
    this.props.status = next
    this.emit(new AssetStatusChanged(this.id, previous, next))
    return ok(undefined)
  }
}
