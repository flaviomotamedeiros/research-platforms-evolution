import { Entity } from './entity.js'
import type { DomainEvent } from './domain-event.js'

export abstract class AggregateRoot<TId extends string = string> extends Entity<TId> {
  private _events: DomainEvent[] = []

  protected emit(event: DomainEvent): void {
    this._events.push(event)
  }

  pullEvents(): DomainEvent[] {
    const events = this._events
    this._events = []
    return events
  }
}
