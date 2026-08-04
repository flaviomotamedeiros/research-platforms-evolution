import { AggregateRoot } from '@rpe/domain-kit'
import { BaseDomainEvent } from '@rpe/domain-kit'
import { fail, ok, type Result } from '@rpe/domain-kit'

export class SubmissionCreated extends BaseDomainEvent {
  constructor(
    readonly submissionId: string,
    readonly activityId: string,
    readonly enrollmentId: string,
  ) {
    super('activity.submission_created', submissionId)
  }
}

export type SubmissionStatus = 'draft' | 'submitted' | 'grading' | 'graded'

export interface SubmissionProps {
  activityId: string
  enrollmentId: string
  attemptNumber: number
  status: SubmissionStatus
  content: Record<string, unknown>
  submittedAt?: Date
}

export type SubmissionError = 'ALREADY_SUBMITTED' | 'ALREADY_BEING_GRADED'

/**
 * A Submission is an aggregate root — a Student's response to an Activity.
 * It is persisted independently of the Activity definition.
 */
export class Submission extends AggregateRoot {
  private constructor(
    id: string,
    private props: SubmissionProps,
  ) {
    super(id)
  }

  static create(id: string, props: Omit<SubmissionProps, 'status' | 'submittedAt'>): Submission {
    const submission = new Submission(id, { ...props, status: 'draft' })
    submission.emit(new SubmissionCreated(id, props.activityId, props.enrollmentId))
    return submission
  }

  static reconstitute(id: string, props: SubmissionProps): Submission {
    return new Submission(id, props)
  }

  get enrollmentId(): string { return this.props.enrollmentId }
  get activityId(): string { return this.props.activityId }
  get attemptNumber(): number { return this.props.attemptNumber }
  get status(): SubmissionStatus { return this.props.status }
  get content(): Record<string, unknown> { return this.props.content }
  get submittedAt(): Date | undefined { return this.props.submittedAt }

  submit(): Result<void, SubmissionError> {
    if (this.props.status === 'submitted' || this.props.status === 'graded') {
      return fail('ALREADY_SUBMITTED')
    }
    if (this.props.status === 'grading') {
      return fail('ALREADY_BEING_GRADED')
    }
    this.props.status = 'submitted'
    this.props.submittedAt = new Date()
    return ok(undefined)
  }

  /** Immutable once grading begins — enforced by this rule. */
  startGrading(): Result<void, SubmissionError> {
    if (this.props.status !== 'submitted') return fail('ALREADY_BEING_GRADED')
    this.props.status = 'grading'
    return ok(undefined)
  }

  markGraded(): void {
    this.props.status = 'graded'
  }
}

export interface SubmissionRepository {
  findById(id: string): Promise<Submission | null>
  findByActivityAndEnrollment(activityId: string, enrollmentId: string): Promise<Submission | null>
  findByActivity(activityId: string): Promise<Submission[]>
  save(submission: Submission): Promise<void>
}
