import { Enrollment, type EnrollmentRepository, type EnrollmentRole } from '@rpe/moodle-core'
import type { PrismaClient } from '@prisma/client'

/** Enrollment repository backed by Neon via Prisma. */
export class PrismaEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(r: {
    id: string
    userId: string
    courseId: string
    role: string
    status: string
    enrolledAt: Date
    deletedAt: Date | null
  }): Enrollment {
    return Enrollment.reconstitute(r.id, {
      userId: r.userId,
      courseId: r.courseId,
      role: r.role as EnrollmentRole,
      status: r.status as 'active' | 'suspended',
      enrolledAt: r.enrolledAt,
      deletedAt: r.deletedAt ?? undefined,
    })
  }

  async findById(id: string): Promise<Enrollment | null> {
    const r = await this.prisma.enrollment.findUnique({ where: { id } })
    return r ? this.toDomain(r) : null
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null> {
    const r = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    return r ? this.toDomain(r) : null
  }

  async findByCourse(courseId: string, role?: EnrollmentRole): Promise<Enrollment[]> {
    const rows = await this.prisma.enrollment.findMany({
      where: { courseId, deletedAt: null, ...(role ? { role } : {}) },
    })
    return rows.map((r) => this.toDomain(r))
  }

  async findByUser(userId: string): Promise<Enrollment[]> {
    const rows = await this.prisma.enrollment.findMany({
      where: { userId, deletedAt: null },
    })
    return rows.map((r) => this.toDomain(r))
  }

  async save(enrollment: Enrollment): Promise<void> {
    const data = {
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      role: enrollment.role,
      status: enrollment.status,
      deletedAt: enrollment.isDeleted ? new Date() : null,
    }
    await this.prisma.enrollment.upsert({
      where: { id: enrollment.id },
      create: { id: enrollment.id, enrolledAt: new Date(), ...data },
      update: data,
    })
  }
}
