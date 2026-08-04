import { AggregateRoot } from '@rpe/domain-kit'
import { BaseDomainEvent } from '@rpe/domain-kit'

export type NotificationChannel = 'email' | 'in_app' | 'push'
export type NotificationStatus = 'pending' | 'delivered' | 'failed'

export class NotificationDelivered extends BaseDomainEvent {
  constructor(readonly notificationId: string, readonly channel: NotificationChannel) {
    super('notification.delivered', notificationId)
  }
}

export interface NotificationProps {
  recipientId: string
  channel: NotificationChannel
  templateId: string
  context: Record<string, unknown>
  status: NotificationStatus
  /** ISO 8601 */
  scheduledFor?: string
  deliveredAt?: Date
  failureReason?: string
  retryCount: number
}

export class Notification extends AggregateRoot {
  private constructor(
    id: string,
    private props: NotificationProps,
  ) {
    super(id)
  }

  static create(
    id: string,
    props: Omit<NotificationProps, 'status' | 'retryCount'>,
  ): Notification {
    return new Notification(id, { ...props, status: 'pending', retryCount: 0 })
  }

  static reconstitute(id: string, props: NotificationProps): Notification {
    return new Notification(id, props)
  }

  get recipientId(): string { return this.props.recipientId }
  get channel(): NotificationChannel { return this.props.channel }
  get status(): NotificationStatus { return this.props.status }
  get retryCount(): number { return this.props.retryCount }

  markDelivered(): void {
    this.props.status = 'delivered'
    this.props.deliveredAt = new Date()
    this.emit(new NotificationDelivered(this.id, this.props.channel))
  }

  /** Exponential backoff retry handled by the infrastructure layer. */
  markFailed(reason: string): void {
    this.props.status = 'failed'
    this.props.failureReason = reason
    this.props.retryCount++
  }

  retry(): void {
    this.props.status = 'pending'
  }
}
