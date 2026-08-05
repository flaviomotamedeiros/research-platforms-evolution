import type { TrackerPlugin, SpecField } from '@rpe/plugin-sdk'

interface SupportFields { channel: string; customer: string }

/** tracker_support — support requests. */
export const trackerSupport: TrackerPlugin = {
  metadata: {
    id: 'tracker_support',
    name: 'Support',
    version: '1.0.0',
    requires: '1.0.0',
    description: 'Support-request tracker.',
    author: 'research-platforms-evolution',
  },
  displayName: 'Support',
  icon: '🎧',
  colour: '#1baf7a',
  describe(fields: string): SpecField[] {
    try {
      const f = JSON.parse(fields) as SupportFields
      return [
        { label: 'Channel', value: f.channel },
        { label: 'Customer', value: f.customer },
      ]
    } catch {
      return []
    }
  },
}
