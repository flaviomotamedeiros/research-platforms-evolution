'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/client/api'
import { AppShell } from '@/components/shell'
import { StatTile, Skeleton } from '@/components/ui'
import { StatusBadge, PriorityBadge, SlaChip, fmtDateTime } from '@/components/glpi-ui'

interface Me { name: string; role: string }
interface Ticket {
  id: string; title: string; status: string; priority: string
  requester: string; technician: string | null; openedAt: string; dueAt: string; breaching: boolean
}
interface Report {
  totals: { open: number; solved: number; breaching: number; total: number }
  sla: { complianceRate: number }
}

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [tickets, setTickets] = useState<Ticket[] | null>(null)
  const [report, setReport] = useState<Report | null>(null)

  useEffect(() => {
    api<Me>('/me').then(setMe).catch(() => {})
    api<Ticket[]>('/tickets').then(setTickets).catch(() => {})
    api<Report>('/report').then(setReport).catch(() => {}) // staff only; ignored for requesters
  }, [])

  const isStaff = me?.role === 'technician' || me?.role === 'admin'
  const open = (tickets ?? []).filter((t) => t.status !== 'solved' && t.status !== 'closed')
  const breaching = (tickets ?? []).filter((t) => t.breaching && t.status !== 'closed')
  const firstName = me?.name.split(' ')[0]
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <AppShell>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-sm capitalize text-ink-3">{today}</p>
          <h1 className="text-3xl font-bold tracking-tight">
            {firstName ? `Hello, ${firstName}` : <Skeleton className="h-9 w-48" />}
          </h1>
        </div>
        {me?.role === 'requester' && (
          <Link href="/tickets" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            My tickets
          </Link>
        )}
      </div>

      {breaching.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-status-critical/30 bg-status-critical/5 p-4">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-critical text-xs font-bold text-white">!</span>
          <div>
            <p className="text-sm font-semibold">{breaching.length} ticket{breaching.length > 1 ? 's' : ''} breaching SLA</p>
            <p className="text-sm text-ink-2">Resolution time has exceeded the agreed service level. Prioritise these.</p>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tickets ? (
          <>
            <StatTile label="Open tickets" value={open.length} accent hint={isStaff ? 'across the service desk' : 'yours'} />
            <StatTile label="Breaching SLA" value={breaching.length} hint="past resolution deadline" />
            <StatTile label={isStaff ? 'Total tickets' : 'My tickets'} value={tickets.length} />
            <StatTile label="SLA compliance" value={report ? `${report.sla.complianceRate}%` : '—'} hint="solved within target" />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        )}
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">Recent tickets</h2>
        <Link href="/tickets" className="text-sm font-medium text-brand hover:underline">View all →</Link>
      </div>
      <div className="overflow-hidden rounded-2xl bg-surface-1 shadow-card">
        {tickets ? (
          <ul className="divide-y divide-black/5">
            {tickets.slice(0, 6).map((t) => (
              <li key={t.id}>
                <Link href={`/tickets/${t.id}`} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-surface-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t.title}</p>
                    <p className="text-xs text-ink-3">{t.requester} · opened {fmtDateTime(t.openedAt)}</p>
                  </div>
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                  {t.breaching && t.status !== 'closed' && <SlaChip breaching />}
                </Link>
              </li>
            ))}
            {tickets.length === 0 && <li className="px-6 py-8 text-center text-sm text-ink-3">No tickets.</li>}
          </ul>
        ) : (
          <div className="p-6"><Skeleton className="h-48" /></div>
        )}
      </div>
    </AppShell>
  )
}
