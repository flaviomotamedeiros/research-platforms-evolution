import type { Migration, PluginMetadata, UserRef } from '../types/common.js'

export interface Credentials {
  username: string
  password: string
  /** Additional fields for specific auth methods (e.g. OTP, domain) */
  extra?: Record<string, string>
}

export interface ExternalUser {
  externalId: string
  email: string
  firstName: string
  lastName: string
  extra?: Record<string, unknown>
}

export interface AuthResult {
  user: UserRef
  /** ISO 8601 expiry timestamp */
  expiresAt: string
}

/**
 * Contract for Authentication plugins (e.g. local, LDAP, OAuth2, SAML).
 * The core delegates authentication to the configured AuthPlugin.
 * Multiple AuthPlugins can be active; the core tries them in priority order.
 */
export interface AuthPlugin {
  metadata: PluginMetadata

  getMigrations(): Migration[]

  /**
   * Attempts to authenticate using the provided credentials.
   * Returns null if authentication fails (wrong password, user not found, etc.).
   * Throws only for infrastructure errors (network down, config invalid).
   */
  authenticate(credentials: Credentials): Promise<AuthResult | null>

  /**
   * Synchronizes an external user record into the platform Identity context.
   * Called after a successful authentication if the plugin manages user data.
   * Optional: implement only if the plugin is authoritative for user profiles.
   */
  syncUser?(externalUser: ExternalUser): Promise<UserRef>

  /**
   * Returns whether this plugin can handle password changes.
   * If false, the platform will not offer a "Change Password" option for users
   * authenticated via this plugin.
   */
  canChangePassword(): boolean

  /**
   * Changes the user's password in the external system.
   * Called only if canChangePassword() returns true.
   */
  changePassword?(user: UserRef, newPassword: string): Promise<void>
}
