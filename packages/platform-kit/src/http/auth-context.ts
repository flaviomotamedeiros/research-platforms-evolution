import type { JwtService, JwtPayload } from '../auth/jwt.js'
import { unauthorized } from './errors.js'

/** Extracts the Bearer token from a request's Authorization header. */
export function bearerToken(req: Request): string | null {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim() || null
}

/**
 * Verifies the request's Bearer token and returns its payload.
 * Throws HttpError(401) when missing or invalid — the Route Handler's
 * try/catch converts it via toErrorResponse.
 */
export function requireAuth(req: Request, jwt: JwtService): JwtPayload {
  const token = bearerToken(req)
  if (!token) throw unauthorized('Missing bearer token')
  const payload = jwt.verify(token)
  if (!payload) throw unauthorized('Invalid or expired token')
  return payload
}
