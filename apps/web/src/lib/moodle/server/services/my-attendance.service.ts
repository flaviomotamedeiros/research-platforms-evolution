import type { Container } from '../container'

export interface MyAttendanceRow {
  courseId: string
  courseName: string
  shortName: string
  present: number
  late: number
  excused: number
  absent: number
  held: number
  rate: number // % of held sessions attended (present+late)
  compliant: boolean // LDB art. 24 VI — ≥75%
}

/** Per-course attendance summary for the authenticated student. */
export async function myAttendance(c: Container, userId: string): Promise<MyAttendanceRow[]> {
  const enrollments = await c.prisma.enrollment.findMany({
    where: { userId, role: 'student', deletedAt: null },
  })
  const courseIds = enrollments.map((e) => e.courseId)
  const [courses, logs] = await Promise.all([
    c.prisma.course.findMany({ where: { id: { in: courseIds } } }),
    c.prisma.attendanceLog.findMany({ where: { userId } }),
  ])
  const sessions = await c.prisma.attendanceSession.findMany({
    where: { courseId: { in: courseIds } },
  })
  const sessionCourse = new Map(sessions.map((s) => [s.id, s.courseId]))

  return courses.map((course) => {
    const own = logs.filter((l) => sessionCourse.get(l.sessionId) === course.id)
    const count = (st: string) => own.filter((l) => l.status === st).length
    const present = count('present')
    const late = count('late')
    const excused = count('excused')
    const absent = count('absent')
    const held = own.length
    const rate = held > 0 ? Math.round(((present + late) / held) * 100) : 100
    return {
      courseId: course.id,
      courseName: course.fullName,
      shortName: course.shortName,
      present, late, excused, absent, held, rate,
      compliant: rate >= 75,
    }
  })
}
