import type { User } from './user.js'

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
}
