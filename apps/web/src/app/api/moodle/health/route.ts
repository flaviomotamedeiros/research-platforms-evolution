import { getContainer } from '@/lib/moodle/server/container'
import { json, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const c = getContainer()
    await c.prisma.$queryRaw`SELECT 1`
    return json({ status: 'ok', db: 'connected' })
  } catch (err) {
    return toErrorResponse(err)
  }
}
