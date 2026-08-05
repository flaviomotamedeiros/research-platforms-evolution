import type { TrackerPlugin, SpecField } from '@rpe/plugin-sdk'

interface FeatureFields { businessValue: string; targetRelease: string }

/** tracker_feature — feature requests. */
export const trackerFeature: TrackerPlugin = {
  metadata: {
    id: 'tracker_feature',
    name: 'Feature',
    version: '1.0.0',
    requires: '1.0.0',
    description: 'Feature-request tracker.',
    author: 'research-platforms-evolution',
  },
  displayName: 'Feature',
  icon: '✨',
  colour: '#2a78d6',
  describe(fields: string): SpecField[] {
    try {
      const f = JSON.parse(fields) as FeatureFields
      return [
        { label: 'Business value', value: f.businessValue },
        { label: 'Target release', value: f.targetRelease },
      ]
    } catch {
      return []
    }
  },
}
