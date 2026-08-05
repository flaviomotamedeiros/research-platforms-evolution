import { AggregateRoot, BaseDomainEvent } from '@rpe/domain-kit'

export class UserCreated extends BaseDomainEvent {
  constructor(readonly userId: string, readonly email: string) {
    super('identity.user_created', userId)
  }
}

export type UserRole = 'admin' | 'technician' | 'requester'

export interface UserProps {
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  entityId: string
  deletedAt?: Date
}

export class User extends AggregateRoot {
  private constructor(id: string, private props: UserProps) {
    super(id)
  }

  static create(id: string, props: UserProps): User {
    const user = new User(id, props)
    user.emit(new UserCreated(id, props.email))
    return user
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
  get entityId(): string { return this.props.entityId }
}
