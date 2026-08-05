'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/redmine/client/api'
import { AppShell } from '@/components/redmine/shell'
import { StatTile, Bar, Skeleton } from '@/components/redmine/ui'
import { StatusBadge } from '@/components/redmine/redmine-ui'

interface Report {
  totals: { open: number; closed: number; overdue: number; total: number }
  progress: number
  byStatus: Array<{ status: string; count: number }>
  byTracker: Array<{ trackerId: string; label: string; icon: string; colour: string; count: number }>
  byAssignee: Array<{ userId: string; name: string; open: number; closed: number }>
  effort: { estimated: number; spent: number }
}

export default function ReportPage() {
  const [r, setR] = useState<Report | null>(null)
  useEffect(() => { api<Report>('/report').then(setR).catch(() => {}) }, [])

  const maxStatus = Math.max(1, ...(r?.byStatus.map((s) => s.count) ?? [1]))
  const maxTracker = Math.max(1, ...(r?.byTracker.map((t) => t.count) ?? [1]))
  const maxTech = Math.max(1, ...(r?.byAssignee.map((t) => t.open + t.closed) ?? [1]))
  const effortPct = r && r.effort.estimated > 0 ? Math.round((r.effort.spent / r.effort.estimated) * 100) : 0

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Project report</h1>
        <p className="mt-1 text-sm text-ink-3">
          Consolidated roadmap across all projects — the read contract{' '}
          <code className="rounded bg-surface-1 px-1.5 py-0.5 text-xs">report/project</code>.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {r ? (
          <>
            <StatTile label="Open" value={r.totals.open} accent />
            <StatTile label="Closed" value={r.totals.closed} />
            <StatTile label="Overdue" value={r.totals.overdue} />
            <StatTile label="Overall progress" value={`${r.progress}%`} hint={`${r.effort.spent}h of ~${r.effort.estimated}h`} />
          </>
        ) : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>

      {r ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-surface-1 p-6 shadow-card">
            <h2 className="mb-4 text-base font-bold">Issues by status</h2>
            <ul className="space-y-3">
              {r.byStatus.map((s) => (
                <li key={s.status} className="grid grid-cols-[120px_1fr_2rem] items-center gap-3">
                  <StatusBadge status={s.status} />
                  <Bar pct={(s.count / maxStatus) * 100} />
                  <span className="text-right text-sm font-bold tabular-nums">{s.count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-surface-1 p-6 shadow-card">
            <h2 className="mb-4 text-base font-bold">Issues by tracker</h2>
            <ul className="space-y-3">
              {r.byTracker.map((t) => (
                <li key={t.trackerId} className="grid grid-cols-[120px_1fr_2rem] items-center gap-3">
                  <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: t.colour }}>{t.icon} {t.label}</span>
                  <Bar pct={(t.count / maxTracker) * 100} color={t.colour} />
                  <span className="text-right text-sm font-bold tabular-nums">{t.count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-surface-1 p-6 shadow-card lg:col-span-2">
            <h2 className="mb-4 text-base font-bold">Workload by assignee</h2>
            <ul className="space-y-3">
              {r.byAssignee.map((t) => (
                <li key={t.userId} className="grid grid-cols-[160px_1fr_auto] items-center gap-3">
                  <span className="truncate text-sm font-semibold">{t.name}</span>
                  <div className="flex h-3 overflow-hidden rounded-full bg-track">
                    <div className="h-full bg-rbrand" style={{ width: `${(t.open / maxTech) * 100}%` }} />
                    <div className="h-full bg-teal" style={{ width: `${(t.closed / maxTech) * 100}%` }} />
                  </div>
                  <span className="text-right text-xs tabular-nums text-ink-2"><span className="font-bold text-rbrand-dark">{t.open} open</span> · {t.closed} closed</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-4 text-xs text-ink-3">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rbrand" /> Open</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-teal" /> Closed</span>
            </div>
          </section>

          <section className="rounded-2xl bg-surface-1 p-6 shadow-card lg:col-span-2">
            <h2 className="mb-1 text-base font-bold">Effort — spent vs estimated</h2>
            <p className="mb-4 text-xs text-ink-3">{r.effort.spent}h logged against ~{r.effort.estimated}h estimated ({effortPct}%)</p>
            <Bar pct={Math.min(100, effortPct)} color={effortPct > 100 ? 'var(--status-critical)' : 'var(--series-1)'} />
          </section>
        </div>
      ) : <Skeleton className="h-64" />}
    </AppShell>
  )
}
