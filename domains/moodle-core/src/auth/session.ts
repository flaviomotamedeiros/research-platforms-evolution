import { Entity } from '@rpe/domain-kit'
import { BaseDomainEvent } from '@rpe/domain-kit'

export class LoginSucceeded extends BaseDomainEvent {
  constructor(readonly userId: string, readonly sessionId: string) {
    super('auth.login_succeeded', sessionId)
  }
}

export class LoginFailed extends BaseDomainEvent {
  constructor(readonly username: string, readonly reason: string) {
    super('auth.login_failed', username)
  }
}

export class LogoutPerformed extends BaseDomainEvent {
  constructor(readonly sessionId: string) {
    super('auth.logout', sessionId)
  }
}

export interface SessionProps {
  userId: string
  /** JWT token */
  accessToken: string
  /** Opaque refresh token */
  refreshToken: string
  expiresAt: Date
  revokedAt?: Date
}

export class Session extends Entity {
  constructor(
    id: string,
    private props: SessionProps,
  ) {
    super(id)
  }

  get userId(): string { return this.props.userId }
  get accessToken(): string { return this.props.accessToken }
  get refreshToken(): string { return this.props.refreshToken }
  get expiresAt(): Date { return this.props.expiresAt }
  get isExpired(): boolean { return new Date() >= this.props.expiresAt }
  get isRevoked(): boolean { return !!this.props.revokedAt }
  get isValid(): boolean { return !this.isExpired && !this.isRevoked }

  revoke(): void {
    this.props.revokedAt = new Date()
  }
}
