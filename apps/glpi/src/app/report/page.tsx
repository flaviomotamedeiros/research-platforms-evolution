'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client/api'
import { AppShell } from '@/components/shell'
import { StatTile, Bar, Skeleton } from '@/components/ui'
import { StatusBadge, PriorityBadge } from '@/components/glpi-ui'

interface Report {
  totals: { open: number; solved: number; breaching: number; total: number }
  byStatus: Array<{ status: string; count: number }>
  byPriority: Array<{ priority: string; count: number }>
  byTechnician: Array<{ technicianId: string; name: string; open: number; solved: number }>
  sla: { met: number; breached: number; complianceRate: number }
}

export default function ReportPage() {
  const [r, setR] = useState<Report | null>(null)

  useEffect(() => {
    api<Report>('/report').then(setR).catch(() => {})
  }, [])

  const maxStatus = Math.max(1, ...(r?.byStatus.map((s) => s.count) ?? [1]))
  const maxPriority = Math.max(1, ...(r?.byPriority.map((s) => s.count) ?? [1]))
  const maxTech = Math.max(1, ...(r?.byTechnician.map((t) => t.open + t.solved) ?? [1]))

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Service-desk report</h1>
        <p className="mt-1 text-sm text-ink-3">
          Consolidated management view — the read contract{' '}
          <code className="rounded bg-surface-1 px-1.5 py-0.5 text-xs">report/servicedesk</code>.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {r ? (
          <>
            <StatTile label="Open" value={r.totals.open} accent />
            <StatTile label="Solved" value={r.totals.solved} />
            <StatTile label="Breaching SLA" value={r.totals.breaching} />
            <StatTile label="SLA compliance" value={`${r.sla.complianceRate}%`} hint={`${r.sla.met} met · ${r.sla.breached} breached`} />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        )}
      </div>

      {r ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* By status */}
          <section className="rounded-2xl bg-surface-1 p-6 shadow-card">
            <h2 className="mb-4 text-base font-bold">Tickets by status</h2>
            <ul className="space-y-3">
              {r.byStatus.map((s) => (
                <li key={s.status} className="grid grid-cols-[110px_1fr_2rem] items-center gap-3">
                  <StatusBadge status={s.status} />
                  <Bar pct={(s.count / maxStatus) * 100} />
                  <span className="text-right text-sm font-bold tabular-nums">{s.count}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* By priority */}
          <section className="rounded-2xl bg-surface-1 p-6 shadow-card">
            <h2 className="mb-4 text-base font-bold">Tickets by priority</h2>
            <ul className="space-y-3">
              {r.byPriority.map((p) => (
                <li key={p.priority} className="grid grid-cols-[110px_1fr_2rem] items-center gap-3">
                  <PriorityBadge priority={p.priority} />
                  <Bar pct={(p.count / maxPriority) * 100} color="var(--series-2)" />
                  <span className="text-right text-sm font-bold tabular-nums">{p.count}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* By technician */}
          <section className="rounded-2xl bg-surface-1 p-6 shadow-card lg:col-span-2">
            <h2 className="mb-4 text-base font-bold">Technician workload</h2>
            <ul className="space-y-3">
              {r.byTechnician.map((t) => (
                <li key={t.technicianId} className="grid grid-cols-[160px_1fr_auto] items-center gap-3">
                  <span className="truncate text-sm font-semibold">{t.name}</span>
                  <div className="flex h-3 overflow-hidden rounded-full bg-track">
                    <div className="h-full bg-brand" style={{ width: `${(t.open / maxTech) * 100}%` }} />
                    <div className="h-full bg-teal" style={{ width: `${(t.solved / maxTech) * 100}%` }} />
                  </div>
                  <span className="text-right text-xs tabular-nums text-ink-2">
                    <span className="font-bold text-brand-dark">{t.open} open</span> · {t.solved} solved
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-4 text-xs text-ink-3">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand" /> Open</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-teal" /> Solved</span>
            </div>
          </section>
        </div>
      ) : (
        <Skeleton className="h-64" />
      )}
    </AppShell>
  )
}
