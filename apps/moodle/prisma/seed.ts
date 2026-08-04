import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'

const prisma = new PrismaClient()
const PASSWORD = 'Moodle@2025'

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10)

  // ── Category ────────────────────────────────────────────────────────────
  const catId = 'cat-ti'
  await prisma.category.upsert({
    where: { id: catId },
    create: { id: catId, name: 'Informática e Computação', idnumber: 'TI' },
    update: {},
  })

  // ── Courses ─────────────────────────────────────────────────────────────
  const courses = [
    { id: 'course-ds', fullName: 'Técnico em Desenvolvimento de Sistemas', shortName: 'TEC-DS' },
    { id: 'course-rd', fullName: 'Técnico em Redes de Computadores', shortName: 'TEC-RD' },
  ]
  for (const c of courses) {
    await prisma.course.upsert({
      where: { id: c.id },
      create: { ...c, categoryId: catId, visible: true },
      update: {},
    })
  }

  // ── Users ───────────────────────────────────────────────────────────────
  const admin = { id: 'user-admin', username: 'admin', email: 'admin@ifal.edu.br', firstName: 'Admin', lastName: 'Sistema', role: 'admin' }
  const teacher = { id: 'user-ana', username: 'ana.cavalcante', email: 'ana@ifal.edu.br', firstName: 'Ana', lastName: 'Cavalcante', role: 'teacher' }
  const students = [
    { id: 'user-pedro', username: 'pedro.ferreira', email: 'pedro@ifal.edu.br', firstName: 'Pedro', lastName: 'Ferreira', role: 'student' },
    { id: 'user-lucas', username: 'lucas.almeida', email: 'lucas@ifal.edu.br', firstName: 'Lucas', lastName: 'Almeida', role: 'student' },
    { id: 'user-maria', username: 'maria.santos', email: 'maria@ifal.edu.br', firstName: 'Maria', lastName: 'Santos', role: 'student' },
  ]
  for (const u of [admin, teacher, ...students]) {
    await prisma.user.upsert({
      where: { id: u.id },
      create: { ...u, passwordHash: hash },
      update: { passwordHash: hash, role: u.role },
    })
  }

  // ── Enrolments ──────────────────────────────────────────────────────────
  const enrol = async (userId: string, courseId: string, role: string) => {
    const id = `enr-${userId}-${courseId}`
    await prisma.enrollment.upsert({
      where: { id },
      create: { id, userId, courseId, role, status: 'active', enrolledAt: new Date() },
      update: {},
    })
    return id
  }
  await enrol(teacher.id, 'course-ds', 'teacher')
  await enrol(teacher.id, 'course-rd', 'teacher')
  const studentEnrolments: Record<string, string> = {}
  for (const s of students) {
    studentEnrolments[`${s.id}:course-ds`] = await enrol(s.id, 'course-ds', 'student')
  }
  studentEnrolments['user-pedro:course-rd'] = await enrol('user-pedro', 'course-rd', 'student')

  // ── Activities ──────────────────────────────────────────────────────────
  const activities = [
    { id: 'act-ds-1', courseId: 'course-ds', name: 'Trabalho 1 — Fundamentos de Python' },
    { id: 'act-ds-2', courseId: 'course-ds', name: 'Trabalho 2 — Estruturas de Dados' },
    { id: 'act-rd-1', courseId: 'course-rd', name: 'Trabalho 1 — Modelo OSI' },
  ]
  for (const a of activities) {
    await prisma.activity.upsert({
      where: { id: a.id },
      create: { id: a.id, courseId: a.courseId, sectionId: 'sec-1', pluginId: 'mod_assign', name: a.name, visible: true },
      update: {},
    })
  }

  // ── Grades + feedback (read-contract data) ───────────────────────────────
  const feedbacks = [
    'Excelente trabalho, código limpo e bem estruturado.',
    'Bom, mas atente-se aos casos de borda.',
    'Precisa revisar os conceitos fundamentais.',
  ]
  const gradeData: Array<[string, string, number, number, string]> = [
    ['user-pedro:course-ds', 'act-ds-1', 85, 100, feedbacks[0]],
    ['user-pedro:course-ds', 'act-ds-2', 72, 100, feedbacks[1]],
    ['user-lucas:course-ds', 'act-ds-1', 48, 100, feedbacks[2]],
    ['user-maria:course-ds', 'act-ds-1', 93, 100, feedbacks[0]],
    ['user-pedro:course-rd', 'act-rd-1', 78, 100, feedbacks[1]],
  ]
  for (const [key, activityId, value, maxValue, feedback] of gradeData) {
    const enrollmentId = studentEnrolments[key]
    const id = `grade-${enrollmentId}-${activityId}`
    await prisma.grade.upsert({
      where: { id },
      create: { id, enrollmentId, activityId, value, maxValue, feedback, gradingStrategyType: 'points' },
      update: { value, feedback },
    })
  }

  // ── Attendance (write-contract data) ─────────────────────────────────────
  const sessionTopics = ['Apresentação do curso', 'Variáveis e tipos', 'Estruturas de controle', 'Funções']
  const dsStudents = students.map((s) => s.id)
  for (let i = 0; i < sessionTopics.length; i++) {
    const sessionId = `sess-ds-${i}`
    await prisma.attendanceSession.upsert({
      where: { id: sessionId },
      create: {
        id: sessionId,
        courseId: 'course-ds',
        date: new Date(2025, 1, 17 + i * 2),
        description: sessionTopics[i],
      },
      update: {},
    })
    for (const userId of dsStudents) {
      // maria always present, lucas misses some, pedro mostly present
      const status =
        userId === 'user-lucas' && i % 2 === 1 ? 'absent' : userId === 'user-pedro' && i === 3 ? 'late' : 'present'
      const logId = `log-${sessionId}-${userId}`
      await prisma.attendanceLog.upsert({
        where: { id: logId },
        create: { id: logId, sessionId, userId, status },
        update: { status },
      })
    }
  }

  console.log('Seed complete. Login with any user below / password:', PASSWORD)
  console.log('  admin, ana.cavalcante (teacher), pedro.ferreira, lucas.almeida, maria.santos (students)')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
