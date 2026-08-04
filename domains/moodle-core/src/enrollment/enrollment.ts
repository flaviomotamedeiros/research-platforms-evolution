import { AggregateRoot } from '@rpe/domain-kit'
import { BaseDomainEvent } from '@rpe/domain-kit'
import { fail, ok, type Result } from '@rpe/domain-kit'

export type EnrollmentRole = 'student' | 'teacher' | 'guest'

export class EnrollmentCreated extends BaseDomainEvent {
  constructor(
    readonly enrollmentId: string,
    readonly userId: string,
    readonly courseId: string,
    readonly role: EnrollmentRole,
  ) {
    super('enrollment.created', enrollmentId)
  }
}

export class EnrollmentSuspended extends BaseDomainEvent {
  constructor(readonly enrollmentId: string) {
    super('enrollment.suspended', enrollmentId)
  }
}

export class EnrollmentRoleChanged extends BaseDomainEvent {
  constructor(
    readonly enrollmentId: string,
    readonly previousRole: EnrollmentRole,
    readonly newRole: EnrollmentRole,
  ) {
    super('enrollment.role_changed', enrollmentId)
  }
}

export class EnrollmentDeleted extends BaseDomainEvent {
  constructor(readonly enrollmentId: string, readonly userId: string, readonly courseId: string) {
    super('enrollment.deleted', enrollmentId)
  }
}

export type EnrollmentStatus = 'active' | 'suspended'

export interface EnrollmentProps {
  userId: string
  courseId: string
  role: EnrollmentRole
  status: EnrollmentStatus
  enrolledAt: Date
  /** Soft delete timestamp — history is preserved for audit. */
  deletedAt?: Date
}

export type EnrollmentError =
  | 'ALREADY_DELETED'
  | 'ALREADY_SUSPENDED'
  | 'ALREADY_ACTIVE'

export class Enrollment extends AggregateRoot {
  private constructor(
    id: string,
    private props: EnrollmentProps,
  ) {
    super(id)
  }

  static create(id: string, props: Omit<EnrollmentProps, 'status' | 'enrolledAt'>): Enrollment {
    const enrollment = new Enrollment(id, {
      ...props,
      status: 'active',
      enrolledAt: new Date(),
    })
    enrollment.emit(new EnrollmentCreated(id, props.userId, props.courseId, props.role))
    return enrollment
  }

  static reconstitute(id: string, props: EnrollmentProps): Enrollment {
    return new Enrollment(id, props)
  }

  get userId(): string { return this.props.userId }
  get courseId(): string { return this.props.courseId }
  get role(): EnrollmentRole { return this.props.role }
  get status(): EnrollmentStatus { return this.props.status }
  get isDeleted(): boolean { return !!this.props.deletedAt }
  get isActive(): boolean { return this.props.status === 'active' && !this.isDeleted }

  changeRole(newRole: EnrollmentRole): Result<void, EnrollmentError> {
    if (this.isDeleted) return fail('ALREADY_DELETED')
    const previous = this.props.role
    this.props.role = newRole
    this.emit(new EnrollmentRoleChanged(this.id, previous, newRole))
    return ok(undefined)
  }

  suspend(): Result<void, EnrollmentError> {
    if (this.isDeleted) return fail('ALREADY_DELETED')
    if (this.props.status === 'suspended') return fail('ALREADY_SUSPENDED')
    this.props.status = 'suspended'
    this.emit(new EnrollmentSuspended(this.id))
    return ok(undefined)
  }

  /** Soft delete. History preserved for grading and audit. */
  delete(): Result<void, EnrollmentError> {
    if (this.isDeleted) return fail('ALREADY_DELETED')
    this.props.deletedAt = new Date()
    this.emit(new EnrollmentDeleted(this.id, this.props.userId, this.props.courseId))
    return ok(undefined)
  }
}
