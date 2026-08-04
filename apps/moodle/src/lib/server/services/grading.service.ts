import { notFound, unauthorized } from '@rpe/platform-kit'
import { BaseDomainEvent } from '@rpe/domain-kit'
import type { Container } from '../container'

/** Emitted whenever a teacher posts or updates a grade (write contract E_out). */
export class GradePosted extends BaseDomainEvent {
  constructor(
    readonly activityId: string,
    readonly studentId: string,
    readonly value: number,
  ) {
    super('grading.grade_posted', activityId)
  }
}

async function requireTeacherOf(c: Container, courseId: string, userId: string) {
  const enrol = await c.prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  if (!enrol || enrol.role !== 'teacher') throw unauthorized('Teacher role required for this course')
}

export interface ActivityGradesView {
  activity: { id: string; name: string; courseId: string; dueDate: string | null }
  rows: Array<{
    userId: string
    name: string
    value: number | null
    maxValue: number
    feedback: string | null
  }>
}

/** Teacher view: every enrolled student with their grade for one activity. */
export async function activityGrades(c: Container, activityId: string, requesterId: string): Promise<ActivityGradesView> {
  const activity = await c.prisma.activity.findUnique({ where: { id: activityId } })
  if (!activity) throw notFound('Activity not found')
  await requireTeacherOf(c, activity.courseId, requesterId)

  const enrollments = await c.prisma.enrollment.findMany({
    where: { courseId: activity.courseId, role: 'student', deletedAt: null },
  })
  const users = await c.prisma.user.findMany({
    where: { id: { in: enrollments.map((e) => e.userId) } },
  })
  const nameOf = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]))
  const grades = await c.prisma.grade.findMany({ where: { activityId } })
  const gradeOf = new Map(grades.map((g) => [g.enrollmentId, g]))

  return {
    activity: {
      id: activity.id,
      name: activity.name,
      courseId: activity.courseId,
      dueDate: activity.dueDate?.toISOString() ?? null,
    },
    rows: enrollments
      .map((e) => {
        const g = gradeOf.get(e.id)
        return {
          userId: e.userId,
          name: nameOf.get(e.userId) ?? e.userId,
          value: g?.value ?? null,
          maxValue: g?.maxValue ?? 100,
          feedback: g?.feedback ?? null,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  }
}

/** Teacher write: upsert a student's grade + feedback for an activity. */
export async function postGrade(
  c: Container,
  activityId: string,
  requesterId: string,
  input: { userId: string; value: number; feedback: string },
): Promise<void> {
  const activity = await c.prisma.activity.findUnique({ where: { id: activityId } })
  if (!activity) throw notFound('Activity not found')
  await requireTeacherOf(c, activity.courseId, requesterId)

  const enrol = await c.prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: input.userId, courseId: activity.courseId } },
  })
  if (!enrol) throw notFound('Student is not enrolled in this course')

  await c.prisma.grade.upsert({
    where: { enrollmentId_activityId: { enrollmentId: enrol.id, activityId } },
    create: {
      id: `g-${enrol.id}-${activityId}`,
      enrollmentId: enrol.id,
      activityId,
      value: input.value,
      maxValue: 100,
      feedback: input.feedback || null,
      gradingStrategyType: 'points',
    },
    update: { value: input.value, feedback: input.feedback || null },
  })

  await c.events.dispatch([new GradePosted(activityId, input.userId, input.value)])
}
