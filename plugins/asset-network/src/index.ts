import type { AssetTypePlugin, SpecField } from '@rpe/plugin-sdk'

interface NetworkSpec {
  ports: string
  mgmtIp: string
  firmware: string
}

/** asset_network — switches, routers, access points. */
export const assetNetwork: AssetTypePlugin = {
  metadata: {
    id: 'asset_network',
    name: 'Network Equipment',
    version: '1.0.0',
    requires: '1.0.0',
    description: 'Switches, routers and access points.',
    author: 'research-platforms-evolution',
  },
  displayName: 'Network',
  icon: '🌐',
  describe(spec: string): SpecField[] {
    try {
      const s = JSON.parse(spec) as NetworkSpec
      return [
        { label: 'Ports', value: s.ports },
        { label: 'Mgmt IP', value: s.mgmtIp },
        { label: 'Firmware', value: s.firmware },
      ]
    } catch {
      return []
    }
  },
}
