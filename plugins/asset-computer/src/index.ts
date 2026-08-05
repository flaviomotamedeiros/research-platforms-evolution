import type { AssetTypePlugin, SpecField } from '@rpe/plugin-sdk'

interface ComputerSpec {
  cpu: string
  ram: string
  storage: string
  os: string
}

/** asset_computer — desktops and laptops. */
export const assetComputer: AssetTypePlugin = {
  metadata: {
    id: 'asset_computer',
    name: 'Computer',
    version: '1.0.0',
    requires: '1.0.0',
    description: 'Desktop and laptop inventory type.',
    author: 'research-platforms-evolution',
  },
  displayName: 'Computer',
  icon: '💻',
  describe(spec: string): SpecField[] {
    try {
      const s = JSON.parse(spec) as ComputerSpec
      return [
        { label: 'CPU', value: s.cpu },
        { label: 'RAM', value: s.ram },
        { label: 'Storage', value: s.storage },
        { label: 'OS', value: s.os },
      ]
    } catch {
      return []
    }
  },
}
