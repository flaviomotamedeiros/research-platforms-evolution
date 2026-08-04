import jwt from 'jsonwebtoken'

export interface JwtPayload {
  sub: string
  email: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface JwtConfig {
  secret: string
  accessTtl?: string | number
  refreshTtl?: string | number
}

/**
 * Framework-agnostic JWT helper. Replaces @nestjs/jwt with a thin wrapper over
 * jsonwebtoken so it runs unchanged inside Next.js Route Handlers (Node runtime).
 */
export class JwtService {
  private readonly secret: string
  private readonly accessTtl: string | number
  private readonly refreshTtl: string | number

  constructor(config: JwtConfig) {
    this.secret = config.secret
    this.accessTtl = config.accessTtl ?? '15m'
    this.refreshTtl = config.refreshTtl ?? '7d'
  }

  issue(payload: JwtPayload): TokenPair {
    return {
      accessToken: jwt.sign(payload, this.secret, { expiresIn: this.accessTtl } as jwt.SignOptions),
      refreshToken: jwt.sign(payload, this.secret, { expiresIn: this.refreshTtl } as jwt.SignOptions),
    }
  }

  /** Verifies a token and returns its payload, or null if invalid/expired. */
  verify(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret)
      if (typeof decoded === 'string') return null
      return { sub: String(decoded.sub), email: String(decoded.email) }
    } catch {
      return null
    }
  }
}
