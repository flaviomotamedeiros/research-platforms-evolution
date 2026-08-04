import { AggregateRoot } from '@rpe/domain-kit'
import { BaseDomainEvent } from '@rpe/domain-kit'

export class ActivityCreated extends BaseDomainEvent {
  constructor(readonly activityId: string, readonly courseId: string, readonly pluginId: string) {
    super('activity.created', activityId)
  }
}

/**
 * An Activity is a definition (forum, quiz, assignment) within a Course Section.
 * Submissions and Completions are SEPARATE aggregates (Submission, Completion)
 * with their own repositories — they are new-system data attached to an activity,
 * not part of the activity definition. This keeps legacy-authored definitions
 * decoupled from new-system writes.
 */
export interface ActivityProps {
  courseId: string
  sectionId: string
  /** Plugin that provides this activity, e.g. "mod_assign" */
  pluginId: string
  name: string
  visible: boolean
}

export class Activity extends AggregateRoot {
  private constructor(
    id: string,
    private props: ActivityProps,
  ) {
    super(id)
  }

  static create(id: string, props: ActivityProps): Activity {
    const activity = new Activity(id, props)
    activity.emit(new ActivityCreated(id, props.courseId, props.pluginId))
    return activity
  }

  static reconstitute(id: string, props: ActivityProps): Activity {
    return new Activity(id, props)
  }

  get courseId(): string { return this.props.courseId }
  get sectionId(): string { return this.props.sectionId }
  get pluginId(): string { return this.props.pluginId }
  get name(): string { return this.props.name }
  get visible(): boolean { return this.props.visible }
}
