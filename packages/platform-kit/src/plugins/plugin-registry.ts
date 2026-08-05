import type {
  ActivityPlugin, AuthPlugin, BlockPlugin, ContentModulePlugin, AssetTypePlugin,
} from '@rpe/plugin-sdk'

type AnyPlugin = ActivityPlugin | AuthPlugin | BlockPlugin | ContentModulePlugin | AssetTypePlugin

export type PluginType = 'activity' | 'auth' | 'block' | 'content' | 'asset_type' | 'grade_aggregation'

interface PluginEntry {
  type: PluginType
  plugin: AnyPlugin
}

/**
 * Central registry for all installed plugins. Framework-agnostic replacement
 * for the NestJS PluginRegistryService. Plugins register at composition time;
 * the platform never imports plugin code directly — only through this registry.
 */
export class PluginRegistry {
  private readonly registry = new Map<string, PluginEntry>()

  register(type: PluginType, plugin: AnyPlugin): this {
    const { id } = plugin.metadata
    if (this.registry.has(id)) return this
    this.registry.set(id, { type, plugin })
    return this
  }

  listByType(type: PluginType): AnyPlugin[] {
    return [...this.registry.values()]
      .filter((e) => e.type === type)
      .map((e) => e.plugin)
  }

  listAuthPlugins(): AuthPlugin[] {
    return this.listByType('auth') as AuthPlugin[]
  }

  listActivityPlugins(): ActivityPlugin[] {
    return this.listByType('activity') as ActivityPlugin[]
  }

  listContentPlugins(): ContentModulePlugin[] {
    return this.listByType('content') as ContentModulePlugin[]
  }

  getActivity(id: string): ActivityPlugin | undefined {
    const entry = this.registry.get(id)
    return entry?.type === 'activity' ? (entry.plugin as ActivityPlugin) : undefined
  }

  getAuth(id: string): AuthPlugin | undefined {
    const entry = this.registry.get(id)
    return entry?.type === 'auth' ? (entry.plugin as AuthPlugin) : undefined
  }

  getContent(id: string): ContentModulePlugin | undefined {
    const entry = this.registry.get(id)
    return entry?.type === 'content' ? (entry.plugin as ContentModulePlugin) : undefined
  }

  getAssetType(id: string): AssetTypePlugin | undefined {
    const entry = this.registry.get(id)
    return entry?.type === 'asset_type' ? (entry.plugin as AssetTypePlugin) : undefined
  }

  listAssetTypes(): AssetTypePlugin[] {
    return this.listByType('asset_type') as AssetTypePlugin[]
  }
}
