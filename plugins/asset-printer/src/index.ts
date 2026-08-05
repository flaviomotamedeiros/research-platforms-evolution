import type { AssetTypePlugin, SpecField } from '@rpe/plugin-sdk'

interface PrinterSpec {
  technology: string
  colour: string
  monthlyDuty: string
}

/** asset_printer — printers and multifunction devices. */
export const assetPrinter: AssetTypePlugin = {
  metadata: {
    id: 'asset_printer',
    name: 'Printer',
    version: '1.0.0',
    requires: '1.0.0',
    description: 'Printers and multifunction devices.',
    author: 'research-platforms-evolution',
  },
  displayName: 'Printer',
  icon: '🖨️',
  describe(spec: string): SpecField[] {
    try {
      const s = JSON.parse(spec) as PrinterSpec
      return [
        { label: 'Technology', value: s.technology },
        { label: 'Colour', value: s.colour },
        { label: 'Monthly duty', value: s.monthlyDuty },
      ]
    } catch {
      return []
    }
  },
}
