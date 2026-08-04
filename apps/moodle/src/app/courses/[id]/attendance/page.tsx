'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '@/lib/client/api'
import { AppShell } from '@/components/shell'
import { StatTile, Bar, StatusChip, Skeleton } from '@/components/ui'

interface Row { userId: string; name: string; present: number; total: number; rate: number; compliant: boolean }
interface Summary { sessions: number; rows: Row[] }
interface Course { id: string; fullName: string; shortName: string }

export default function CourseAttendancePage() {
  const params = useParams<{ id: string }>()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [course, setCourse] = useState<Course | null>(null)

  useEffect(() => {
    api<Summary>(`/courses/${params.id}/attendance`).then(setSummary).catch(() => {})
    api<Course[]>('/me/courses')
      .then((cs) => setCourse(cs.find((c) => c.id === params.id) ?? null))
      .catch(() => {})
  }, [params.id])

  const rows = summary?.rows ?? []
  const compliant = rows.filter((r) => r.compliant).length
  const atRisk = rows.length - compliant
  const avgRate = rows.length ? Math.round(rows.reduce((s, r) => s + r.rate, 0) / rows.length) : null
  const sorted = [...rows].sort((a, b) => a.rate - b.rate)

  return (
    <AppShell>
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm font-medium text-brand hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {course ? course.fullName : <Skeleton className="h-9 w-96" />}
        </h1>
        <p className="mt-1 text-sm text-ink-3">
          Attendance ledger — the write contract{' '}
          <code className="rounded bg-surface-1 px-1.5 py-0.5 text-xs">mod/attendance</code>. Legal minimum:
          75% (Brazilian education law, LDB art. 24 VI).
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary ? (
          <>
            <StatTile label="Classes held" value={summary.sessions} />
            <StatTile label="Average attendance" value={avgRate !== null ? `${avgRate}%` : '—'} accent />
            <StatTile label="Compliant" value={compliant} hint="≥ 75% attendance" />
            <StatTile label="At risk" value={atRisk} hint="below the legal minimum" />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        )}
      </div>

      <section className="overflow-hidden rounded-2xl bg-surface-1 shadow-card">
        <header className="border-b border-black/5 px-6 py-4">
          <h2 className="text-base font-bold">Students ({rows.length})</h2>
          <p className="text-xs text-ink-3">Sorted by attendance rate — critical cases first.</p>
        </header>
        {summary ? (
          <ul className="divide-y divide-black/5">
            {sorted.map((r) => (
              <li key={r.userId} className="grid items-center gap-3 px-6 py-3.5 sm:grid-cols-[220px_1fr_auto]">
                <p className="text-sm font-semibold">{r.name}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Bar
                      pct={r.rate}
                      color={r.compliant ? 'var(--series-1)' : 'var(--status-critical)'}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs tabular-nums text-ink-2">
                    {r.present}/{r.total} · <span className="font-bold text-ink-1">{r.rate}%</span>
                  </span>
                </div>
                <div className="justify-self-end">
                  {r.compliant ? (
                    <StatusChip kind="good" label="Compliant" />
                  ) : (
                    <StatusChip kind="critical" label="Below 75%" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6"><Skeleton className="h-48" /></div>
        )}
      </section>
    </AppShell>
  )
}
