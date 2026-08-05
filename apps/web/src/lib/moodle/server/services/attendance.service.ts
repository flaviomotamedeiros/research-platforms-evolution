import { randomUUID } from 'node:crypto'
import { BaseDomainEvent } from '@rpe/domain-kit'
import type { Container } from '../container'

/**
 * WRITE CONTRACT — mod/attendance (the paper's write-contract case).
 *
 * Owns tables (attendance_sessions, attendance_logs), invokes no core write API
 * in this minimal slice but emits domain events (E_out) that other components
 * may react to. Reimplementing this contract on the modern stack means
 * recreating these owned tables and the event emissions — nothing of the host
 * platform core beyond them.
 */

export class AttendanceTaken extends BaseDomainEvent {
  constructor(
    readonly sessionId: string,
    readonly courseId: string,
    readonly present: number,
    readonly total: number,
  ) {
    super('attendance.taken', sessionId)
  }
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface CreateSessionInput {
  courseId: string
  date: string
  description: string
  marks: Array<{ userId: string; status: AttendanceStatus }>
}

export async function createSession(c: Container, input: CreateSessionInput) {
  const sessionId = randomUUID()

  await c.prisma.attendanceSession.create({
    data: {
      id: sessionId,
      courseId: input.courseId,
      date: new Date(input.date),
      description: input.description,
    },
  })

  await c.prisma.attendanceLog.createMany({
    data: input.marks.map((m) => ({
      id: randomUUID(),
      sessionId,
      userId: m.userId,
      status: m.status,
    })),
  })

  const present = input.marks.filter((m) => m.status === 'present' || m.status === 'late').length
  await c.events.dispatch([
    new AttendanceTaken(sessionId, input.courseId, present, input.marks.length),
  ])

  return { sessionId, present, total: input.marks.length }
}

export interface AttendanceSummaryRow {
  userId: string
  name: string
  present: number
  total: number
  rate: number
  compliant: boolean // LDB art. 24 VI — ≥75%
}

export async function courseAttendance(
  c: Container,
  courseId: string,
): Promise<{ sessions: number; rows: AttendanceSummaryRow[] }> {
  const sessions = await c.prisma.attendanceSession.findMany({ where: { courseId } })
  const sessionIds = sessions.map((s) => s.id)
  const logs = await c.prisma.attendanceLog.findMany({
    where: { sessionId: { in: sessionIds } },
  })

  const enrollments = await c.prisma.enrollment.findMany({
    where: { courseId, role: 'student', deletedAt: null },
  })
  const users = await c.prisma.user.findMany({
    where: { id: { in: enrollments.map((e) => e.userId) } },
  })
  const userName = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]))

  const rows: AttendanceSummaryRow[] = enrollments.map((e) => {
    const own = logs.filter((l) => l.userId === e.userId)
    const present = own.filter((l) => l.status === 'present' || l.status === 'late').length
    const total = sessions.length
    const rate = total > 0 ? Math.round((present / total) * 100) : 0
    return {
      userId: e.userId,
      name: userName.get(e.userId) ?? e.userId,
      present,
      total,
      rate,
      compliant: rate >= 75,
    }
  })

  return { sessions: sessions.length, rows }
}
