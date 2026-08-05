import { EventBus, PluginRegistry, JwtService } from '@rpe/platform-kit'
import { prisma } from './prisma'
import { authLocalPlugin } from '../plugins/auth-local'
import { assetComputer } from '@rpe/asset-computer'
import { assetNetwork } from '@rpe/asset-network'
import { assetPrinter } from '@rpe/asset-printer'

/**
 * Composition root — the framework-agnostic replacement for NestJS dependency
 * injection, shared verbatim in spirit with the Moodle app. Same platform-kit,
 * a different bounded context and a different plugin set.
 */
export interface Container {
  prisma: typeof prisma
  events: EventBus
  plugins: PluginRegistry
  jwt: JwtService
}

function build(): Container {
  const events = new EventBus()

  // Plugin installation point — asset types are plugins, mirroring GLPI.
  const plugins = new PluginRegistry()
    .register('auth', authLocalPlugin(prisma))
    .register('asset_type', assetComputer)
    .register('asset_type', assetNetwork)
    .register('asset_type', assetPrinter)

  const jwt = new JwtService({
    secret: process.env.JWT_SECRET ?? 'insecure-dev-secret',
    accessTtl: '30m',
    refreshTtl: '7d',
  })

  return { prisma, events, plugins, jwt }
}

const globalForContainer = globalThis as unknown as { container?: Container }

export function getContainer(): Container {
  globalForContainer.container ??= build()
  return globalForContainer.container
}
