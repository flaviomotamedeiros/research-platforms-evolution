import type { DomainEvent } from '@rpe/domain-kit'

type Handler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void>

/**
 * In-process event bus. Framework-agnostic replacement for the NestJS
 * EventBusService: no decorators, no DI — just a Map of handlers.
 *
 * In a serverless deployment there is no persistent process between requests,
 * so handlers run synchronously within the dispatching request. For background
 * work, swap the dispatch body to enqueue onto a durable queue (e.g. QStash).
 */
export class EventBus {
  private readonly handlers = new Map<string, Handler[]>()

  on<T extends DomainEvent>(eventName: string, handler: Handler<T>): void {
    const existing = this.handlers.get(eventName) ?? []
    this.handlers.set(eventName, [...existing, handler as Handler])
  }

  async dispatch(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      const handlers = this.handlers.get(event.eventName) ?? []
      await Promise.all(handlers.map((h) => h(event)))
    }
  }
}
