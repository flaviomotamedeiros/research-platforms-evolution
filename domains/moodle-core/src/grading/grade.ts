import { AggregateRoot } from '@rpe/domain-kit'
import { BaseDomainEvent } from '@rpe/domain-kit'
import { fail, ok, type Result } from '@rpe/domain-kit'

export class GradeCreated extends BaseDomainEvent {
  constructor(readonly gradeId: string, readonly enrollmentId: string, readonly activityId: string) {
    super('grade.created', gradeId)
  }
}

export class GradeUpdated extends BaseDomainEvent {
  constructor(readonly gradeId: string, readonly value: number) {
    super('grade.updated', gradeId)
  }
}

export class GradeOverridden extends BaseDomainEvent {
  constructor(
    readonly gradeId: string,
    readonly previousValue: number | null,
    readonly overriddenValue: number,
    readonly reason: string,
  ) {
    super('grade.overridden', gradeId)
  }
}

export interface GradeProps {
  enrollmentId: string
  activityId: string
  /** Raw score — null until graded. */
  value: number | null
  maxValue: number
  feedback?: string
  /** GradingStrategy type used at the time of grading, stored for audit. */
  gradingStrategyType: string
  gradedAt?: Date
  /** Manual override is allowed but logged. */
  overriddenAt?: Date
  overrideReason?: string
}

export type GradeError = 'EXCEEDS_MAX' | 'NEGATIVE_VALUE'

export class Grade extends AggregateRoot {
  private constructor(
    id: string,
    private props: GradeProps,
  ) {
    super(id)
  }

  static create(id: string, props: GradeProps): Grade {
    const grade = new Grade(id, props)
    grade.emit(new GradeCreated(id, props.enrollmentId, props.activityId))
    return grade
  }

  static reconstitute(id: string, props: GradeProps): Grade {
    return new Grade(id, props)
  }

  get enrollmentId(): string { return this.props.enrollmentId }
  get activityId(): string { return this.props.activityId }
  get value(): number | null { return this.props.value }
  get maxValue(): number { return this.props.maxValue }
  get feedback(): string | undefined { return this.props.feedback }
  get percentage(): number | null {
    if (this.props.value === null) return null
    return (this.props.value / this.props.maxValue) * 100
  }

  assign(value: number, feedback?: string): Result<void, GradeError> {
    if (value < 0) return fail('NEGATIVE_VALUE')
    if (value > this.props.maxValue) return fail('EXCEEDS_MAX')
    this.props.value = value
    this.props.feedback = feedback
    this.props.gradedAt = new Date()
    this.emit(new GradeUpdated(this.id, value))
    return ok(undefined)
  }

  /** Manual override is allowed but must be logged per domain rule. */
  override(value: number, reason: string): Result<void, GradeError> {
    if (value < 0) return fail('NEGATIVE_VALUE')
    if (value > this.props.maxValue) return fail('EXCEEDS_MAX')
    const previous = this.props.value
    this.props.value = value
    this.props.overriddenAt = new Date()
    this.props.overrideReason = reason
    this.emit(new GradeOverridden(this.id, previous, value, reason))
    return ok(undefined)
  }
}
