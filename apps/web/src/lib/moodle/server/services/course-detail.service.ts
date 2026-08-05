import { notFound } from '@rpe/platform-kit'
import type { RenderedContent } from '@rpe/plugin-sdk'
import type { Container } from '../container'

export interface CourseDetail {
  id: string
  fullName: string
  shortName: string
  teacher: string
  role: 'student' | 'teacher'
  studentCount: number
  sections: Array<{
    id: string
    name: string
    summary: string
    materials: Array<{
      id: string
      title: string
      plugin: { id: string; displayName: string; icon: string }
      display: RenderedContent
    }>
    activities: Array<{
      id: string
      name: string
      description: string
      dueDate: string | null
      plugin: string
      // student view
      myGrade: number | null
      myMax: number | null
      myFeedback: string | null
      // teacher view
      gradedCount: number
      expectedCount: number
    }>
  }>
  lessonPlan: Array<{ id: string; date: string; topic: string; held: boolean }>
}

/** Full course view: sections, materials, activities and the lesson plan.
 *  Grade fields are filled according to the requester's role. */
export async function courseDetail(c: Container, courseId: string, userId: string): Promise<CourseDetail> {
  const course = await c.prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw notFound('Course not found')

  const enrollments = await c.prisma.enrollment.findMany({
    where: { courseId, deletedAt: null },
  })
  const mine = enrollments.find((e) => e.userId === userId)
  if (!mine) throw notFound('Not enrolled in this course')
  const role = mine.role === 'teacher' ? 'teacher' : 'student'
  const students = enrollments.filter((e) => e.role === 'student')

  const teacherEnrol = enrollments.find((e) => e.role === 'teacher')
  const teacherUser = teacherEnrol
    ? await c.prisma.user.findUnique({ where: { id: teacherEnrol.userId } })
    : null

  const [sections, materials, activities, sessions] = await Promise.all([
    c.prisma.courseSection.findMany({ where: { courseId }, orderBy: { order: 'asc' } }),
    c.prisma.material.findMany({ where: { courseId } }),
    c.prisma.activity.findMany({ where: { courseId, visible: true } }),
    c.prisma.attendanceSession.findMany({ where: { courseId }, orderBy: { date: 'asc' } }),
  ])

  const grades = await c.prisma.grade.findMany({
    where: { activityId: { in: activities.map((a) => a.id) } },
  })
  const myGrades = new Map(
    grades.filter((g) => g.enrollmentId === mine.id).map((g) => [g.activityId, g]),
  )
  const gradedCountOf = (activityId: string) =>
    grades.filter((g) => g.activityId === activityId && g.value !== null).length

  const now = new Date()
  return {
    id: course.id,
    fullName: course.fullName,
    shortName: course.shortName,
    teacher: teacherUser ? `${teacherUser.firstName} ${teacherUser.lastName}` : '',
    role,
    studentCount: students.length,
    sections: sections.map((s) => ({
      id: s.id,
      name: s.name,
      summary: s.summary,
      // The core never interprets material payloads: it resolves the content
      // plugin from the registry and renders whatever medium it returns.
      materials: materials
        .filter((m) => m.sectionId === s.id)
        .map((m) => {
          const plugin = c.plugins.getContent(m.pluginId)
          const display: RenderedContent = plugin
            ? plugin.render(m.content)
            : { medium: 'html', html: '<p>Unsupported content module.</p>' }
          return {
            id: m.id,
            title: m.title,
            plugin: plugin
              ? { id: plugin.metadata.id, displayName: plugin.displayName, icon: plugin.icon }
              : { id: m.pluginId, displayName: m.pluginId, icon: '❓' },
            display,
          }
        }),
      activities: activities
        .filter((a) => a.sectionId === s.id)
        .map((a) => {
          const g = myGrades.get(a.id)
          return {
            id: a.id,
            name: a.name,
            description: a.description,
            dueDate: a.dueDate?.toISOString() ?? null,
            plugin: a.pluginId,
            myGrade: role === 'student' ? (g?.value ?? null) : null,
            myMax: role === 'student' ? (g?.maxValue ?? null) : null,
            myFeedback: role === 'student' ? (g?.feedback ?? null) : null,
            gradedCount: gradedCountOf(a.id),
            expectedCount: students.length,
          }
        }),
    })),
    lessonPlan: sessions.map((s) => ({
      id: s.id,
      date: s.date.toISOString(),
      topic: s.description,
      held: s.date < now,
    })),
  }
}
