import { z } from 'zod'
import { getContainer } from '@/lib/redmine/server/container'
import { updateIssue } from '@/lib/redmine/server/services/issue-update.service'
import { requireAuth, json, badRequest, toErrorResponse } from '@rpe/platform-kit'
export const runtime = 'nodejs'
const S = z.object({
  notes: z.string().min(1).max(2000),
  newStatus: z.enum(['new','in_progress','resolved','feedback','closed']).optional(),
  doneRatio: z.number().min(0).max(100).optional(),
  assignToSelf: z.boolean().optional(),
  logHours: z.number().min(0).max(100).optional(),
})
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const c = getContainer()
    const payload = requireAuth(req, c.jwt)
    const p = S.safeParse(await req.json().catch(() => null))
    if (!p.success) throw badRequest('INVALID_BODY', 'notes is required')
    return json(await updateIssue(c, params.id, payload.sub, p.data), { status: 201 })
  } catch (err) { return toErrorResponse(err) }
}
