import { AggregateRoot } from '@rpe/domain-kit'
import { BaseDomainEvent } from '@rpe/domain-kit'

export class UserCreated extends BaseDomainEvent {
  constructor(
    readonly userId: string,
    readonly email: string,
  ) {
    super('identity.user_created', userId)
  }
}

export class UserDeleted extends BaseDomainEvent {
  constructor(readonly userId: string) {
    super('identity.user_deleted', userId)
  }
}

export interface UserProps {
  username: string
  email: string
  firstName: string
  lastName: string
  /** Soft delete: deleted users are preserved for audit */
  deletedAt?: Date
}

export class User extends AggregateRoot {
  private constructor(
    id: string,
    private props: UserProps,
  ) {
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
  get isDeleted(): boolean { return !!this.props.deletedAt }

  updateProfile(firstName: string, lastName: string): void {
    this.props.firstName = firstName
    this.props.lastName = lastName
  }

  /** Soft delete — grades and submissions are preserved for audit. */
  delete(): void {
    if (this.isDeleted) return
    this.props.deletedAt = new Date()
    this.emit(new UserDeleted(this.id))
  }
}
