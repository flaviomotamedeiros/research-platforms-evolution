import type { Activity } from './activity.js'

export interface ActivityRepository {
  findById(id: string): Promise<Activity | null>
  findByCourse(courseId: string): Promise<Activity[]>
  save(activity: Activity): Promise<void>
}
