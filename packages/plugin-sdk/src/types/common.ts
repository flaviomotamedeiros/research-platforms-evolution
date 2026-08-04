/** Semantic version string, e.g. "1.0.0" */
export type SemVer = string

export interface PluginMetadata {
  /** Unique identifier, e.g. "mod_forum" or "auth_ldap" */
  id: string
  /** Human-readable display name */
  name: string
  version: SemVer
  /** Minimum platform version required */
  requires: SemVer
  description: string
  author: string
}

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  handler: string
}

/**
 * Sandboxed persistence handed to a plugin by the core. Each plugin gets a
 * store scoped to its own id — it cannot read or write another plugin's data,
 * and never touches the core database directly. This is how a third-party
 * plugin owns its data without coupling to the platform internals.
 */
export interface PluginStorage {
  get<T = unknown>(collection: string, key: string): Promise<T | null>
  set<T = unknown>(collection: string, key: string, value: T): Promise<void>
}

export interface EventListener<T = unknown> {
  event: string
  handler: (payload: T) => Promise<void>
}

export interface Migration {
  version: SemVer
  up: (db: unknown) => Promise<void>
  down?: (db: unknown) => Promise<void>
}

/** Reference to a User by ID only — plugins never receive full User objects */
export interface UserRef {
  id: string
}

/** Reference to a Course by ID only */
export interface CourseRef {
  id: string
}

/** Reference to an Enrollment by ID only */
export interface EnrollmentRef {
  id: string
  userId: string
  courseId: string
  role: 'student' | 'teacher' | 'guest'
}
