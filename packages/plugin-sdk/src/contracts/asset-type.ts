import type { PluginMetadata } from '../types/common.js'

/** A single rendered spec field for display (e.g. "CPU" → "Intel i7"). */
export interface SpecField {
  label: string
  value: string
}

/**
 * Contract for Asset Type plugins (the GLPI counterpart: Computer, Monitor,
 * NetworkEquipment, Printer, … each an inventory type). Each asset row
 * references an asset-type plugin by id; the platform core stores an opaque
 * spec payload and delegates its interpretation and display to the plugin.
 */
export interface AssetTypePlugin {
  metadata: PluginMetadata

  /** Human-readable type label (e.g. "Computer"). */
  displayName: string

  /** Emoji or short glyph used as the type icon. */
  icon: string

  /**
   * Parses the stored spec payload (opaque to the core) into display fields.
   * Must not throw on malformed input — return an empty list instead.
   */
  describe(spec: string): SpecField[]
}
