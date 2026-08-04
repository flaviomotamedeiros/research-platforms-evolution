import { getContainer } from '@/lib/server/container'
import { requireAuth, json, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'

/** Courses the authenticated user is enrolled in, with teacher and counts. */
export async function GET(req: Request) {
  try {
    const c = getContainer()
    const payload = requireAuth(req, c.jwt)

    const enrollments = await c.prisma.enrollment.findMany({
      where: { userId: payload.sub, deletedAt: null },
    })
    const courseIds = enrollments.map((e) => e.courseId)

    const [courses, teacherEnrols, activities] = await Promise.all([
      c.prisma.course.findMany({ where: { id: { in: courseIds } } }),
      c.prisma.enrollment.findMany({ where: { courseId: { in: courseIds }, role: 'teacher' } }),
      c.prisma.activity.findMany({ where: { courseId: { in: courseIds }, visible: true } }),
    ])
    const teachers = await c.prisma.user.findMany({
      where: { id: { in: teacherEnrols.map((t) => t.userId) } },
    })
    const teacherName = new Map(teachers.map((t) => [t.id, `${t.firstName} ${t.lastName}`]))
    const teacherOfCourse = new Map(teacherEnrols.map((t) => [t.courseId, teacherName.get(t.userId) ?? '']))

    const result = enrollments
      .map((e) => {
        const course = courses.find((x) => x.id === e.courseId)
        if (!course) return null
        return {
          id: course.id,
          fullName: course.fullName,
          shortName: course.shortName,
          role: e.role,
          teacher: teacherOfCourse.get(course.id) ?? '',
          activityCount: activities.filter((a) => a.courseId === course.id).length,
        }
      })
      .filter(Boolean)

    return json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
