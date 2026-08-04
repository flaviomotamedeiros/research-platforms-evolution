import { fail, ok, type Result } from '@rpe/domain-kit'
import { Enrollment, type EnrollmentRole } from './enrollment.js'
import type { EnrollmentRepository } from './enrollment.repository.js'

export type EnrollUserError =
  | 'ALREADY_ENROLLED'
  | 'USER_NOT_FOUND'
  | 'COURSE_NOT_FOUND'

interface Deps {
  enrollments: EnrollmentRepository
  generateId: () => string
}

/**
 * Domain service: enrolling a user does not belong to Enrollment alone
 * (it needs to check course existence) nor to Course (it owns no enrollment data).
 */
export class EnrollUserService {
  constructor(private readonly deps: Deps) {}

  async execute(
    userId: string,
    courseId: string,
    role: EnrollmentRole,
  ): Promise<Result<Enrollment, EnrollUserError>> {
    const existing = await this.deps.enrollments.findByUserAndCourse(userId, courseId)

    if (existing && !existing.isDeleted) {
      return fail('ALREADY_ENROLLED')
    }

    const enrollment = Enrollment.create(this.deps.generateId(), {
      userId,
      courseId,
      role,
    })

    await this.deps.enrollments.save(enrollment)
    return ok(enrollment)
  }
}
