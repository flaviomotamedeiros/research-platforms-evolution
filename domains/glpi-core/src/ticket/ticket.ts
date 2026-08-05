import { AggregateRoot, BaseDomainEvent, fail, ok, type Result } from '@rpe/domain-kit'

export type TicketStatus = 'new' | 'assigned' | 'pending' | 'solved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export class TicketOpened extends BaseDomainEvent {
  constructor(readonly ticketId: string, readonly requesterId: string, readonly priority: TicketPriority) {
    super('ticket.opened', ticketId)
  }
}

export class TicketAssigned extends BaseDomainEvent {
  constructor(readonly ticketId: string, readonly technicianId: string) {
    super('ticket.assigned', ticketId)
  }
}

export class TicketStatusChanged extends BaseDomainEvent {
  constructor(readonly ticketId: string, readonly previous: TicketStatus, readonly next: TicketStatus) {
    super('ticket.status_changed', ticketId)
  }
}

export class TicketSolved extends BaseDomainEvent {
  constructor(readonly ticketId: string, readonly withinSla: boolean) {
    super('ticket.solved', ticketId)
  }
}

export interface TicketProps {
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  requesterId: string
  technicianId?: string
  assetId?: string
  slaId: string
  entityId: string
  openedAt: Date
  /** Deadline derived from SLA at open time. */
  dueAt: Date
  solvedAt?: Date
}

export type TicketError =
  | 'TITLE_REQUIRED'
  | 'ALREADY_CLOSED'
  | 'CANNOT_SOLVE_UNASSIGNED'

export class Ticket extends AggregateRoot {
  private constructor(id: string, private props: TicketProps) {
    super(id)
  }

  static open(
    id: string,
    props: Omit<TicketProps, 'status' | 'openedAt' | 'solvedAt'>,
  ): Result<Ticket, TicketError> {
    if (!props.title.trim()) return fail('TITLE_REQUIRED')
    const ticket = new Ticket(id, { ...props, status: 'new', openedAt: new Date() })
    ticket.emit(new TicketOpened(id, props.requesterId, props.priority))
    return ok(ticket)
  }

  static reconstitute(id: string, props: TicketProps): Ticket {
    return new Ticket(id, props)
  }

  get title(): string { return this.props.title }
  get description(): string { return this.props.description }
  get status(): TicketStatus { return this.props.status }
  get priority(): TicketPriority { return this.props.priority }
  get requesterId(): string { return this.props.requesterId }
  get technicianId(): string | undefined { return this.props.technicianId }
  get assetId(): string | undefined { return this.props.assetId }
  get slaId(): string { return this.props.slaId }
  get entityId(): string { return this.props.entityId }
  get openedAt(): Date { return this.props.openedAt }
  get dueAt(): Date { return this.props.dueAt }
  get solvedAt(): Date | undefined { return this.props.solvedAt }

  /** True while unsolved and past the SLA deadline. */
  get isBreachingSla(): boolean {
    if (this.props.status === 'solved' || this.props.status === 'closed') {
      return !!this.props.solvedAt && this.props.solvedAt > this.props.dueAt
    }
    return new Date() > this.props.dueAt
  }

  assignTo(technicianId: string): Result<void, TicketError> {
    if (this.props.status === 'closed') return fail('ALREADY_CLOSED')
    this.props.technicianId = technicianId
    if (this.props.status === 'new') {
      this.props.status = 'assigned'
      this.emit(new TicketStatusChanged(this.id, 'new', 'assigned'))
    }
    this.emit(new TicketAssigned(this.id, technicianId))
    return ok(undefined)
  }

  changeStatus(next: TicketStatus): Result<void, TicketError> {
    if (this.props.status === 'closed') return fail('ALREADY_CLOSED')
    if (next === 'solved') {
      if (!this.props.technicianId) return fail('CANNOT_SOLVE_UNASSIGNED')
      this.props.solvedAt = new Date()
      const previous = this.props.status
      this.props.status = 'solved'
      this.emit(new TicketStatusChanged(this.id, previous, 'solved'))
      this.emit(new TicketSolved(this.id, !this.isBreachingSla))
      return ok(undefined)
    }
    const previous = this.props.status
    this.props.status = next
    this.emit(new TicketStatusChanged(this.id, previous, next))
    return ok(undefined)
  }
}
