import { EventBus, PluginRegistry, JwtService } from '@rpe/platform-kit'
import { prisma } from './prisma'
import { PrismaCourseRepository } from './repositories/prisma-course.repository'
import { PrismaUserRepository } from './repositories/prisma-user.repository'
import { PrismaEnrollmentRepository } from './repositories/prisma-enrollment.repository'
import { authLocalPlugin } from '../plugins/auth-local'
import { modPage } from '@rpe/mod-page'
import { modVideo } from '@rpe/mod-video'
import { modUrl } from '@rpe/mod-url'

/**
 * Composition root — the framework-agnostic replacement for NestJS dependency
 * injection. It instantiates every singleton once (PrismaClient → repositories
 * → infrastructure services) and exposes them to Route Handlers via getContainer().
 */
export interface Container {
  prisma: typeof prisma
  events: EventBus
  plugins: PluginRegistry
  jwt: JwtService
  repositories: {
    courses: PrismaCourseRepository
    users: PrismaUserRepository
    enrollments: PrismaEnrollmentRepository
  }
}

function build(): Container {
  const events = new EventBus()

  // Plugin installation point — the platform counterpart of Moodle's
  // plugin directory. Content formats are plugins, exactly as upstream.
  const plugins = new PluginRegistry()
    .register('auth', authLocalPlugin(prisma))
    .register('content', modPage)
    .register('content', modVideo)
    .register('content', modUrl)

  const jwt = new JwtService({
    secret: process.env.JWT_SECRET ?? 'insecure-dev-secret',
    accessTtl: '30m',
    refreshTtl: '7d',
  })

  return {
    prisma,
    events,
    plugins,
    jwt,
    repositories: {
      courses: new PrismaCourseRepository(prisma),
      users: new PrismaUserRepository(prisma),
      enrollments: new PrismaEnrollmentRepository(prisma),
    },
  }
}

const globalForContainer = globalThis as unknown as { container?: Container }

export function getContainer(): Container {
  globalForContainer.container ??= build()
  return globalForContainer.container
}
