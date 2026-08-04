import { getContainer } from '@/lib/server/container'
import { requireAuth, json, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'

/** Courses the authenticated user is enrolled in. */
export async function GET(req: Request) {
  try {
    const c = getContainer()
    const payload = requireAuth(req, c.jwt)

    const enrollments = await c.repositories.enrollments.findByUser(payload.sub)
    const courses = await Promise.all(
      enrollments.map(async (e) => {
        const course = await c.repositories.courses.findById(e.courseId)
        return course
          ? {
              id: course.id,
              fullName: course.fullName,
              shortName: course.shortName,
              role: e.role,
            }
          : null
      }),
    )

    return json(courses.filter(Boolean))
  } catch (err) {
    return toErrorResponse(err)
  }
}
