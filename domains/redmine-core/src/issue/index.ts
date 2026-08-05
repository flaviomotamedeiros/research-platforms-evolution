import { AggregateRoot, BaseDomainEvent, fail, ok, type Result } from '@rpe/domain-kit'

export type IssueStatus = 'new' | 'in_progress' | 'resolved' | 'feedback' | 'closed'
export type IssuePriority = 'low' | 'normal' | 'high' | 'urgent'

export class IssueOpened extends BaseDomainEvent {
  constructor(readonly issueId: string, readonly projectId: string, readonly trackerPluginId: string) {
    super('issue.opened', issueId)
  }
}

export class IssueStatusChanged extends BaseDomainEvent {
  constructor(readonly issueId: string, readonly previous: IssueStatus, readonly next: IssueStatus) {
    super('issue.status_changed', issueId)
  }
}

export class IssueProgressed extends BaseDomainEvent {
  constructor(readonly issueId: string, readonly doneRatio: number) {
    super('issue.progressed', issueId)
  }
}

export interface IssueProps {
  projectId: string
  trackerPluginId: string
  subject: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  authorId: string
  assigneeId?: string
  doneRatio: number
  estimatedHours?: number
  fields: string // opaque tracker-specific payload
  createdAt: Date
  dueDate?: Date
  closedAt?: Date
}

export type IssueError = 'SUBJECT_REQUIRED' | 'ALREADY_CLOSED' | 'INVALID_RATIO'

export class Issue extends AggregateRoot {
  private constructor(id: string, private props: IssueProps) {
    super(id)
  }

  static open(
    id: string,
    props: Omit<IssueProps, 'status' | 'doneRatio' | 'createdAt' | 'closedAt'>,
  ): Result<Issue, IssueError> {
    if (!props.subject.trim()) return fail('SUBJECT_REQUIRED')
    const issue = new Issue(id, { ...props, status: 'new', doneRatio: 0, createdAt: new Date() })
    issue.emit(new IssueOpened(id, props.projectId, props.trackerPluginId))
    return ok(issue)
  }

  static reconstitute(id: string, props: IssueProps): Issue {
    return new Issue(id, props)
  }

  get projectId(): string { return this.props.projectId }
  get trackerPluginId(): string { return this.props.trackerPluginId }
  get subject(): string { return this.props.subject }
  get description(): string { return this.props.description }
  get status(): IssueStatus { return this.props.status }
  get priority(): IssuePriority { return this.props.priority }
  get authorId(): string { return this.props.authorId }
  get assigneeId(): string | undefined { return this.props.assigneeId }
  get doneRatio(): number { return this.props.doneRatio }
  get estimatedHours(): number | undefined { return this.props.estimatedHours }
  get fields(): string { return this.props.fields }
  get createdAt(): Date { return this.props.createdAt }
  get dueDate(): Date | undefined { return this.props.dueDate }
  get closedAt(): Date | undefined { return this.props.closedAt }
  get isOverdue(): boolean {
    return !!this.props.dueDate && this.status !== 'closed' && new Date() > this.props.dueDate
  }

  assignTo(userId: string): Result<void, IssueError> {
    if (this.props.status === 'closed') return fail('ALREADY_CLOSED')
    this.props.assigneeId = userId
    return ok(undefined)
  }

  setProgress(ratio: number): Result<void, IssueError> {
    if (ratio < 0 || ratio > 100) return fail('INVALID_RATIO')
    this.props.doneRatio = ratio
    this.emit(new IssueProgressed(this.id, ratio))
    return ok(undefined)
  }

  changeStatus(next: IssueStatus): Result<void, IssueError> {
    if (this.props.status === 'closed') return fail('ALREADY_CLOSED')
    const previous = this.props.status
    this.props.status = next
    if (next === 'closed') {
      this.props.closedAt = new Date()
      this.props.doneRatio = 100
    }
    this.emit(new IssueStatusChanged(this.id, previous, next))
    return ok(undefined)
  }
}

export interface IssueRepository {
  findById(id: string): Promise<Issue | null>
  findByProject(projectId: string): Promise<Issue[]>
  findByAssignee(assigneeId: string): Promise<Issue[]>
  save(issue: Issue): Promise<void>
}
