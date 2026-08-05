import type { TrackerPlugin, SpecField } from '@rpe/plugin-sdk'

interface BugFields { severity: string; reproducibility: string; foundIn: string }

/** tracker_bug — defect reports. */
export const trackerBug: TrackerPlugin = {
  metadata: {
    id: 'tracker_bug',
    name: 'Bug',
    version: '1.0.0',
    requires: '1.0.0',
    description: 'Defect tracker.',
    author: 'research-platforms-evolution',
  },
  displayName: 'Bug',
  icon: '🐞',
  colour: '#d03b3b',
  describe(fields: string): SpecField[] {
    try {
      const f = JSON.parse(fields) as BugFields
      return [
        { label: 'Severity', value: f.severity },
        { label: 'Reproducibility', value: f.reproducibility },
        { label: 'Found in', value: f.foundIn },
      ]
    } catch {
      return []
    }
  },
}
