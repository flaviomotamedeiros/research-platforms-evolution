import type { Container } from '../container'

/**
 * READ CONTRACT — report/myfeedback (the paper's read-contract case).
 *
 * Owns no tables. Aggregates data produced by other modules (enrolments,
 * activities, grades) into a per-student consolidated view of grades and
 * teacher feedback across all enrolled courses. In the modernised stack the
 * contract's query set Q maps directly onto this single service method, and its
 * output schema V_out is the FeedbackReport type below.
 */

export interface FeedbackItem {
  courseId: string
  courseName: string
  activityId: string
  activityName: string
  grade: number | null
  maxGrade: number
  percentage: number | null
  feedback: string | null
}

export interface FeedbackReport {
  userId: string
  items: FeedbackItem[]
  stats: {
    total: number
    graded: number
    pending: number
    average: number | null
  }
}

export async function feedbackReport(c: Container, userId: string): Promise<FeedbackReport> {
  // T_src: enrollments ⋈ courses ⋈ activities ⋈ grades
  const enrollments = await c.prisma.enrollment.findMany({
    where: { userId, deletedAt: null },
  })
  const courseIds = enrollments.map((e) => e.courseId)
  const enrollmentByCourse = new Map(enrollments.map((e) => [e.courseId, e.id]))

  const [courses, activities] = await Promise.all([
    c.prisma.course.findMany({ where: { id: { in: courseIds } } }),
    c.prisma.activity.findMany({ where: { courseId: { in: courseIds }, visible: true } }),
  ])
  const courseName = new Map(courses.map((c) => [c.id, c.fullName]))

  const enrollmentIds = [...enrollmentByCourse.values()]
  const grades = await c.prisma.grade.findMany({
    where: { enrollmentId: { in: enrollmentIds } },
  })
  const gradeByActivity = new Map(grades.map((g) => [`${g.enrollmentId}:${g.activityId}`, g]))

  const items: FeedbackItem[] = activities.map((a) => {
    const enrollmentId = enrollmentByCourse.get(a.courseId)!
    const g = gradeByActivity.get(`${enrollmentId}:${a.id}`)
    const grade = g?.value ?? null
    const maxGrade = g?.maxValue ?? 100
    return {
      courseId: a.courseId,
      courseName: courseName.get(a.courseId) ?? a.courseId,
      activityId: a.id,
      activityName: a.name,
      grade,
      maxGrade,
      percentage: grade !== null && maxGrade > 0 ? Math.round((grade / maxGrade) * 100) : null,
      feedback: g?.feedback ?? null,
    }
  })

  const graded = items.filter((i) => i.grade !== null)
  const average =
    graded.length > 0
      ? Math.round(graded.reduce((s, i) => s + (i.percentage ?? 0), 0) / graded.length)
      : null

  return {
    userId,
    items,
    stats: { total: items.length, graded: graded.length, pending: items.length - graded.length, average },
  }
}
