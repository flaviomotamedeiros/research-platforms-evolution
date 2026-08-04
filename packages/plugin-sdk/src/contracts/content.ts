import type { PluginMetadata } from '../types/common.js'

/**
 * Normalised output of a content module. The platform core renders these
 * media generically and never inspects plugin-specific payloads.
 */
export interface RenderedContent {
  medium: 'html' | 'embed' | 'link'
  /** medium = 'html': sanitised HTML body to render inline */
  html?: string
  /** medium = 'embed': iframe URL (e.g. a privacy-enhanced video player) */
  embedUrl?: string
  /** medium = 'link': external URL to open in a new tab */
  url?: string
  /** optional caption/instruction shown under the content */
  note?: string
}

/**
 * Contract for Content Module plugins (the Moodle counterpart: mod_page,
 * mod_url, mod_resource, …). Each course material row references a content
 * plugin by id; the core delegates parsing and presentation to the plugin
 * and renders the returned RenderedContent by its medium alone.
 */
export interface ContentModulePlugin {
  metadata: PluginMetadata

  /** Human-readable type label shown in the UI (e.g. "Reading", "Video"). */
  displayName: string

  /** Emoji or short glyph used as the material icon. */
  icon: string

  /**
   * Parses the stored content payload (opaque to the core) and returns a
   * renderable representation. Must not throw on malformed input — return a
   * best-effort link or empty html instead.
   */
  render(stored: string): RenderedContent
}
