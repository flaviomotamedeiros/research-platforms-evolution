'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/glpi/client/api'
import { AppShell } from '@/components/glpi/shell'
import { StatTile, Skeleton, StatusChip } from '@/components/glpi/ui'

interface SpecField { label: string; value: string }
interface Item {
  id: string; name: string; status: string; serialNumber: string; assignedTo: string | null
  type: { id: string; displayName: string; icon: string }
  spec: SpecField[]
}

const STATUS_LABEL: Record<string, string> = {
  in_use: 'In use', spare: 'Spare', repair: 'In repair', retired: 'Retired',
}

export default function AssetsPage() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [type, setType] = useState<string>('all')

  useEffect(() => {
    api<Item[]>('/assets').then(setItems).catch(() => {})
  }, [])

  const types = ['all', ...new Set((items ?? []).map((i) => i.type.id))]
  const shown = (items ?? []).filter((i) => type === 'all' || i.type.id === type)
  const inRepair = (items ?? []).filter((i) => i.status === 'repair').length

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Asset inventory</h1>
        <p className="mt-1 text-sm text-ink-3">
          Asset types are plugins — each parses and describes its own spec.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items ? (
          <>
            <StatTile label="Assets" value={items.length} accent />
            <StatTile label="In use" value={items.filter((i) => i.status === 'in_use').length} />
            <StatTile label="In repair" value={inRepair} />
            <StatTile label="Types" value={new Set(items.map((i) => i.type.id)).size} hint="registered plugins" />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        )}
      </div>

      {items && (
        <div className="mb-4 flex flex-wrap gap-2">
          {types.map((tp) => {
            const label = tp === 'all' ? 'All' : items.find((i) => i.type.id === tp)?.type.displayName ?? tp
            return (
              <button
                key={tp}
                onClick={() => setType(tp)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  type === tp ? 'bg-gbrand text-white' : 'bg-surface-1 text-ink-2 shadow-card hover:text-ink-1'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {items ? (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((a) => (
            <div key={a.id} className="rounded-2xl bg-surface-1 p-5 shadow-card">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gbrand-light text-xl">{a.type.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold">{a.name}</p>
                    {a.status === 'repair'
                      ? <StatusChip kind="warning" label="In repair" />
                      : a.status === 'retired'
                        ? <span className="rounded-full bg-surface-0 px-2.5 py-1 text-xs font-medium text-ink-3">Retired</span>
                        : <StatusChip kind="good" label={STATUS_LABEL[a.status] ?? a.status} />}
                  </div>
                  <p className="text-xs text-ink-3">{a.type.displayName} · SN {a.serialNumber}</p>
                  <p className="mt-0.5 text-xs text-ink-3">{a.assignedTo ? `Assigned to ${a.assignedTo}` : 'Unassigned'}</p>
                </div>
              </div>
              {a.spec.length > 0 && (
                <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-black/5 pt-4">
                  {a.spec.map((f) => (
                    <div key={f.label}>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-3">{f.label}</dt>
                      <dd className="text-sm font-medium">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Skeleton className="h-64" />
      )}
    </AppShell>
  )
}
