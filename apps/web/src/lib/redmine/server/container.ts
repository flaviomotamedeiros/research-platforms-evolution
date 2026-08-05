import { EventBus, PluginRegistry, JwtService } from '@rpe/platform-kit'
import { prisma } from './prisma'
import { authLocalPlugin } from '../plugins/auth-local'
import { trackerBug } from '@rpe/tracker-bug'
import { trackerFeature } from '@rpe/tracker-feature'
import { trackerSupport } from '@rpe/tracker-support'

/**
 * Composition root — same platform-kit as Moodle and GLPI, a different bounded
 * context and a different plugin set (issue trackers).
 */
export interface Container {
  prisma: typeof prisma
  events: EventBus
  plugins: PluginRegistry
  jwt: JwtService
}

function build(): Container {
  const events = new EventBus()

  // Plugin installation point — issue trackers are plugins, mirroring Redmine.
  const plugins = new PluginRegistry()
    .register('auth', authLocalPlugin(prisma))
    .register('tracker', trackerBug)
    .register('tracker', trackerFeature)
    .register('tracker', trackerSupport)

  const jwt = new JwtService({
    secret: process.env.REDMINE_JWT_SECRET ?? 'insecure-dev-secret',
    accessTtl: '30m',
    refreshTtl: '7d',
  })

  return { prisma, events, plugins, jwt }
}

const globalForContainer = globalThis as unknown as { container_redmine?: Container }

export function getContainer(): Container {
  globalForContainer.container_redmine ??= build()
  return globalForContainer.container_redmine
}
