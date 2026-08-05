import { AggregateRoot, BaseDomainEvent } from '@rpe/domain-kit'

export type UserRole = 'admin' | 'manager' | 'developer' | 'reporter'

export class UserCreated extends BaseDomainEvent {
  constructor(readonly userId: string, readonly email: string) {
    super('identity.user_created', userId)
  }
}

export interface UserProps {
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  deletedAt?: Date
}

export class User extends AggregateRoot {
  private constructor(id: string, private props: UserProps) {
    super(id)
  }

  static create(id: string, props: UserProps): User {
    const u = new User(id, props)
    u.emit(new UserCreated(id, props.email))
    return u
  }

  static reconstitute(id: string, props: UserProps): User {
    return new User(id, props)
  }

  get username(): string { return this.props.username }
  get email(): string { return this.props.email }
  get firstName(): string { return this.props.firstName }
  get lastName(): string { return this.props.lastName }
  get fullName(): string { return `${this.props.firstName} ${this.props.lastName}` }
  get role(): UserRole { return this.props.role }
}

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
}
