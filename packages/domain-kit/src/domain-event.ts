export interface DomainEvent {
  readonly eventName: string
  readonly occurredAt: Date
  readonly aggregateId: string
}

export abstract class BaseDomainEvent implements DomainEvent {
  readonly occurredAt: Date

  constructor(
    readonly eventName: string,
    readonly aggregateId: string,
  ) {
    this.occurredAt = new Date()
  }
}
