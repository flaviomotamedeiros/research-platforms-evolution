/**
 * HTTP error mapping for Route Handlers. Replaces the NestJS exception filter:
 * domain code paths throw HttpError (or DomainError with a code→message map),
 * and `toErrorResponse` turns any thrown value into a JSON Response.
 */

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message?: string,
  ) {
    super(message ?? code)
    this.name = 'HttpError'
  }
}

export const notFound = (message?: string) => new HttpError(404, 'NOT_FOUND', message)
export const unauthorized = (message?: string) => new HttpError(401, 'UNAUTHORIZED', message)
export const badRequest = (code: string, message?: string) => new HttpError(400, code, message)

/**
 * Maps a domain error code (returned by a Result) to an HTTP 400 response,
 * using an optional human-readable message table.
 */
export function domainError(code: string, messages: Record<string, string> = {}): HttpError {
  return new HttpError(400, code, messages[code] ?? code)
}

export function json(data: unknown, init?: ResponseInit): Response {
  return new Response(data === undefined ? null : JSON.stringify(data), {
    status: init?.status ?? (data === undefined ? 204 : 200),
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
}

export function toErrorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return json({ error: err.code, message: err.message }, { status: err.status })
  }
  const message = err instanceof Error ? err.message : 'Internal error'
  return json({ error: 'INTERNAL', message }, { status: 500 })
}
