import { z } from 'zod'
import { getContainer } from '@/lib/server/container'
import { addFollowup } from '@/lib/server/services/ticket-followup.service'
import { requireAuth, json, badRequest, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'

const FollowupSchema = z.object({
  body: z.string().min(1).max(2000),
  newStatus: z.enum(['new', 'assigned', 'pending', 'solved', 'closed']).optional(),
  assignToSelf: z.boolean().optional(),
})

/** WRITE CONTRACT endpoint — add a follow-up and optionally transition status. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const c = getContainer()
    const payload = requireAuth(req, c.jwt)
    const parsed = FollowupSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) throw badRequest('INVALID_BODY', 'body is required')
    return json(await addFollowup(c, params.id, payload.sub, parsed.data), { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
