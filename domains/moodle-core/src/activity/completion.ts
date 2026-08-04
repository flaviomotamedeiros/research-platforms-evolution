import { AggregateRoot } from '@rpe/domain-kit'
import { BaseDomainEvent } from '@rpe/domain-kit'

export class CompletionAchieved extends BaseDomainEvent {
  constructor(
    readonly activityId: string,
    readonly enrollmentId: string,
  ) {
    super('activity.completion_achieved', activityId)
  }
}

export interface CompletionProps {
  activityId: string
  enrollmentId: string
  completedAt?: Date
  /** Which criteria were satisfied, keyed by criterion key */
  satisfiedCriteria: string[]
}

/** A Completion is an aggregate root — a Student's completion state for an Activity. */
export class Completion extends AggregateRoot {
  private constructor(
    id: string,
    private props: CompletionProps,
  ) {
    super(id)
  }

  static create(id: string, props: Omit<CompletionProps, 'completedAt' | 'satisfiedCriteria'>): Completion {
    return new Completion(id, { ...props, satisfiedCriteria: [] })
  }

  static reconstitute(id: string, props: CompletionProps): Completion {
    return new Completion(id, props)
  }

  get enrollmentId(): string { return this.props.enrollmentId }
  get activityId(): string { return this.props.activityId }
  get completedAt(): Date | undefined { return this.props.completedAt }
  get isComplete(): boolean { return !!this.props.completedAt }

  satisfy(criterionKey: string): void {
    if (!this.props.satisfiedCriteria.includes(criterionKey)) {
      this.props.satisfiedCriteria.push(criterionKey)
    }
  }

  markComplete(): void {
    if (!this.props.completedAt) {
      this.props.completedAt = new Date()
      this.emit(new CompletionAchieved(this.props.activityId, this.props.enrollmentId))
    }
  }
}

export interface CompletionRepository {
  findByActivityAndEnrollment(activityId: string, enrollmentId: string): Promise<Completion | null>
  save(completion: Completion): Promise<void>
}
