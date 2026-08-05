import { z } from 'zod'
import { getContainer } from '@/lib/glpi/server/container'
import { login } from '@/lib/glpi/server/services/auth.service'
import { json, badRequest, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'

const LoginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) })

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) throw badRequest('INVALID_BODY', 'username and password are required')
    return json(await login(getContainer(), parsed.data))
  } catch (err) {
    return toErrorResponse(err)
  }
}
