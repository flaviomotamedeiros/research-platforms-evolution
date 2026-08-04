import type { Course } from './course.js'

export interface CourseRepository {
  findById(id: string): Promise<Course | null>
  findByShortName(shortName: string): Promise<Course | null>
  findByCategory(categoryId: string): Promise<Course[]>
  save(course: Course): Promise<void>
  delete(id: string): Promise<void>
}
