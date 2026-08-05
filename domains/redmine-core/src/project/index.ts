import { AggregateRoot, BaseDomainEvent, fail, ok, type Result } from '@rpe/domain-kit'

export class ProjectCreated extends BaseDomainEvent {
  constructor(readonly projectId: string, readonly identifier: string) {
    super('project.created', projectId)
  }
}

export type ProjectStatus = 'active' | 'closed' | 'archived'

export interface ProjectProps {
  name: string
  identifier: string
  description: string
  status: ProjectStatus
  leadId: string
}

export type ProjectError = 'NAME_REQUIRED' | 'IDENTIFIER_REQUIRED'

export class Project extends AggregateRoot {
  private constructor(id: string, private props: ProjectProps) {
    super(id)
  }

  static create(id: string, props: ProjectProps): Result<Project, ProjectError> {
    if (!props.name.trim()) return fail('NAME_REQUIRED')
    if (!props.identifier.trim()) return fail('IDENTIFIER_REQUIRED')
    const p = new Project(id, props)
    p.emit(new ProjectCreated(id, props.identifier))
    return ok(p)
  }

  static reconstitute(id: string, props: ProjectProps): Project {
    return new Project(id, props)
  }

  get name(): string { return this.props.name }
  get identifier(): string { return this.props.identifier }
  get description(): string { return this.props.description }
  get status(): ProjectStatus { return this.props.status }
  get leadId(): string { return this.props.leadId }
}

export interface ProjectRepository {
  findById(id: string): Promise<Project | null>
  findAll(): Promise<Project[]>
  save(project: Project): Promise<void>
}
