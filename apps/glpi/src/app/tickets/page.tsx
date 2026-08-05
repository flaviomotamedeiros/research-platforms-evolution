'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/client/api'
import { AppShell } from '@/components/shell'
import { Skeleton } from '@/components/ui'
import { StatusBadge, PriorityBadge, SlaChip, fmtDateTime } from '@/components/glpi-ui'

interface Ticket {
  id: string; title: string; status: string; priority: string
  requester: string; technician: string | null; openedAt: string; dueAt: string; breaching: boolean
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'breaching', label: 'Breaching SLA' },
  { key: 'solved', label: 'Solved' },
] as const

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all')

  useEffect(() => {
    api<Ticket[]>('/tickets').then(setTickets).catch(() => {})
  }, [])

  const shown = (tickets ?? []).filter((t) => {
    if (filter === 'open') return t.status !== 'solved' && t.status !== 'closed'
    if (filter === 'solved') return t.status === 'solved' || t.status === 'closed'
    if (filter === 'breaching') return t.breaching && t.status !== 'closed'
    return true
  })

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
        <p className="mt-1 text-sm text-ink-3">Support requests with SLA tracking.</p>
      </div>

      <div className="mb-4 flex gap-1 rounded-xl bg-surface-1 p-1 shadow-card sm:w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-brand text-white' : 'text-ink-2 hover:text-ink-1'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-surface-1 shadow-card">
        {tickets ? (
          <ul className="divide-y divide-black/5">
            {shown.map((t) => (
              <li key={t.id}>
                <Link href={`/tickets/${t.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition-colors hover:bg-surface-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t.title}</p>
                    <p className="text-xs text-ink-3">
                      {t.requester}
                      {t.technician ? ` · assigned to ${t.technician}` : ' · unassigned'}
                      {' · opened '}{fmtDateTime(t.openedAt)}
                    </p>
                  </div>
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                  {t.breaching && t.status !== 'closed' && <SlaChip breaching />}
                </Link>
              </li>
            ))}
            {shown.length === 0 && <li className="px-6 py-10 text-center text-sm text-ink-3">No tickets in this view.</li>}
          </ul>
        ) : (
          <div className="p-6"><Skeleton className="h-64" /></div>
        )}
      </div>
    </AppShell>
  )
}
