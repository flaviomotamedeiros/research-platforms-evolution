import { z } from 'zod'
import { getContainer } from '@/lib/moodle/server/container'
import { activityGrades, postGrade } from '@/lib/moodle/server/services/grading.service'
import { requireAuth, json, badRequest, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'

/** Teacher: list every student's grade for one activity. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const c = getContainer()
    const payload = requireAuth(req, c.jwt)
    return json(await activityGrades(c, params.id, payload.sub))
  } catch (err) {
    return toErrorResponse(err)
  }
}

const GradeSchema = z.object({
  userId: z.string().min(1),
  value: z.number().min(0).max(100),
  feedback: z.string().max(2000).default(''),
})

/** Teacher: post or update a student's grade + feedback (write contract). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const c = getContainer()
    const payload = requireAuth(req, c.jwt)
    const body = await req.json().catch(() => null)
    const parsed = GradeSchema.safeParse(body)
    if (!parsed.success) throw badRequest('INVALID_BODY', 'userId and value (0–100) are required')
    await postGrade(c, params.id, payload.sub, parsed.data)
    return json({ ok: true }, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
