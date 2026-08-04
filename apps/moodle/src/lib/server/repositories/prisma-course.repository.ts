import { Course, type CourseRepository } from '@rpe/moodle-core'
import type { PrismaClient } from '@prisma/client'

/** Course repository backed by the Neon (PostgreSQL) database via Prisma. */
export class PrismaCourseRepository implements CourseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(r: {
    id: string
    fullName: string
    shortName: string
    categoryId: string
    visible: boolean
  }): Course {
    return Course.reconstitute(r.id, {
      fullName: r.fullName,
      shortName: r.shortName,
      categoryId: r.categoryId,
      visible: r.visible,
      sections: [],
    })
  }

  async findById(id: string): Promise<Course | null> {
    const r = await this.prisma.course.findUnique({ where: { id } })
    return r ? this.toDomain(r) : null
  }

  async findByShortName(shortName: string): Promise<Course | null> {
    const r = await this.prisma.course.findFirst({ where: { shortName } })
    return r ? this.toDomain(r) : null
  }

  async findByCategory(categoryId: string): Promise<Course[]> {
    const rows = await this.prisma.course.findMany({ where: { categoryId } })
    return rows.map((r) => this.toDomain(r))
  }

  async save(course: Course): Promise<void> {
    const data = {
      fullName: course.fullName,
      shortName: course.shortName,
      categoryId: course.categoryId,
      visible: course.visible,
    }
    await this.prisma.course.upsert({
      where: { id: course.id },
      create: { id: course.id, ...data },
      update: data,
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.course.deleteMany({ where: { id } })
  }
}
