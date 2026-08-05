import type { PluginMetadata } from '../types/common.js'
import type { SpecField } from './asset-type.js'

/**
 * Contract for Tracker plugins (the Redmine counterpart: Bug, Feature, Support
 * trackers). Each issue references a tracker plugin by id; the platform core
 * stores an opaque per-issue fields payload and delegates its interpretation
 * and the tracker's display identity to the plugin.
 */
export interface TrackerPlugin {
  metadata: PluginMetadata

  /** Human-readable tracker label (e.g. "Bug"). */
  displayName: string

  /** Emoji or short glyph used as the tracker icon. */
  icon: string

  /** Accent colour (hex) for the tracker's badge. */
  colour: string

  /**
   * Parses the stored per-issue fields payload (opaque to the core) into
   * display fields specific to this tracker. Must not throw on malformed input.
   */
  describe(fields: string): SpecField[]
}
