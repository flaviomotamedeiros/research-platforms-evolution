import type { Enrollment, EnrollmentRole } from './enrollment.js'

export interface EnrollmentRepository {
  findById(id: string): Promise<Enrollment | null>
  findByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null>
  findByCourse(courseId: string, role?: EnrollmentRole): Promise<Enrollment[]>
  findByUser(userId: string): Promise<Enrollment[]>
  save(enrollment: Enrollment): Promise<void>
}
