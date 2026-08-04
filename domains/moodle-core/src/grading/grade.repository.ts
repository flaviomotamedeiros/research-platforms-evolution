import type { Grade } from './grade.js'

export interface GradeRepository {
  findById(id: string): Promise<Grade | null>
  findByEnrollmentAndActivity(enrollmentId: string, activityId: string): Promise<Grade | null>
  findByEnrollment(enrollmentId: string): Promise<Grade[]>
  findByCourse(courseId: string): Promise<Grade[]>
  save(grade: Grade): Promise<void>
}
