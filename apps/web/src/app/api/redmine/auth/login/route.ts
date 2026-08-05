import { z } from 'zod'
import { getContainer } from '@/lib/redmine/server/container'
import { login } from '@/lib/redmine/server/services/auth.service'
import { json, badRequest, toErrorResponse } from '@rpe/platform-kit'
export const runtime = 'nodejs'
const S = z.object({ username: z.string().min(1), password: z.string().min(1) })
export async function POST(req: Request) {
  try {
    const p = S.safeParse(await req.json().catch(() => null))
    if (!p.success) throw badRequest('INVALID_BODY', 'username and password are required')
    return json(await login(getContainer(), p.data))
  } catch (err) { return toErrorResponse(err) }
}
