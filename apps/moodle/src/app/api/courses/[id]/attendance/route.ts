import { z } from 'zod'
import { getContainer } from '@/lib/server/container'
import { courseAttendance, createSession } from '@/lib/server/services/attendance.service'
import { requireAuth, json, badRequest, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'

/** WRITE CONTRACT endpoint — mod/attendance. GET summary, POST a session. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const c = getContainer()
    requireAuth(req, c.jwt)
    return json(await courseAttendance(c, params.id))
  } catch (err) {
    return toErrorResponse(err)
  }
}

const SessionSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1),
  marks: z.array(
    z.object({
      userId: z.string().min(1),
      status: z.enum(['present', 'absent', 'late', 'excused']),
    }),
  ),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const c = getContainer()
    requireAuth(req, c.jwt)
    const body = await req.json().catch(() => null)
    const parsed = SessionSchema.safeParse(body)
    if (!parsed.success) throw badRequest('INVALID_BODY', 'date, description and marks are required')

    const result = await createSession(c, { courseId: params.id, ...parsed.data })
    return json(result, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
