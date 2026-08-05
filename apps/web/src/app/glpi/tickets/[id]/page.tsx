'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '@/lib/glpi/client/api'
import { AppShell } from '@/components/glpi/shell'
import { Skeleton } from '@/components/glpi/ui'
import { StatusBadge, PriorityBadge, SlaChip, fmtDateTime } from '@/components/glpi/glpi-ui'

interface Detail {
  id: string; title: string; description: string; status: string; priority: string
  requester: string; technician: string | null; sla: string
  openedAt: string; dueAt: string; solvedAt: string | null; breaching: boolean
  asset: { id: string; name: string; type: string; icon: string } | null
  followups: Array<{ id: string; author: string; body: string; createdAt: string }>
  canFollowup: boolean
}

const NEXT_STATUS: Record<string, Array<{ value: string; label: string }>> = {
  new:      [{ value: 'pending', label: 'Mark pending' }, { value: 'solved', label: 'Resolve' }],
  assigned: [{ value: 'pending', label: 'Mark pending' }, { value: 'solved', label: 'Resolve' }],
  pending:  [{ value: 'assigned', label: 'Resume' }, { value: 'solved', label: 'Resolve' }],
  solved:   [{ value: 'closed', label: 'Close' }],
  closed:   [],
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>()
  const [t, setT] = useState<Detail | null>(null)
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<string>('')
  const [assign, setAssign] = useState(false)
  const [saving, setSaving] = useState(false)

  function load() {
    api<Detail>(`/tickets/${params.id}`).then((d) => { setT(d); setStatus('') }).catch(() => {})
  }
  useEffect(load, [params.id])

  async function submit() {
    if (!body.trim()) return
    setSaving(true)
    try {
      await api(`/tickets/${params.id}/followup`, {
        method: 'POST',
        body: JSON.stringify({
          body,
          newStatus: status || undefined,
          assignToSelf: assign || undefined,
        }),
      })
      setBody(''); setAssign(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <Link href="/glpi/tickets" className="text-sm font-medium text-gbrand hover:underline">← Tickets</Link>
      {!t ? (
        <Skeleton className="mt-4 h-96" />
      ) : (
        <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main column */}
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
              <StatusBadge status={t.status} />
              {t.breaching && t.status !== 'closed' && <SlaChip breaching />}
            </div>
            <div className="rounded-2xl bg-surface-1 p-6 shadow-card">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">{t.description}</p>
            </div>

            {/* Follow-ups (write contract) */}
            <h2 className="mb-3 mt-8 text-lg font-bold">Follow-ups ({t.followups.length})</h2>
            <div className="space-y-3">
              {t.followups.map((f) => (
                <div key={f.id} className="rounded-2xl bg-surface-1 p-4 shadow-card">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold">{f.author}</span>
                    <span className="text-xs text-ink-3">{fmtDateTime(f.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-line text-sm text-ink-2">{f.body}</p>
                </div>
              ))}
              {t.followups.length === 0 && (
                <p className="rounded-2xl bg-surface-1 p-4 text-sm text-ink-3 shadow-card">No follow-ups yet.</p>
              )}
            </div>

            {t.canFollowup && t.status !== 'closed' && (
              <div className="mt-4 rounded-2xl bg-surface-1 p-4 shadow-card">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Add a follow-up for the requester…"
                  rows={3}
                  className="w-full resize-y rounded-xl border border-black/10 bg-surface-0 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gbrand/40"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {!t.technician && (
                    <label className="flex items-center gap-2 text-sm text-ink-2">
                      <input type="checkbox" checked={assign} onChange={(e) => setAssign(e.target.checked)} />
                      Assign to me
                    </label>
                  )}
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg border border-black/10 bg-surface-0 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gbrand/40"
                  >
                    <option value="">Keep status</option>
                    {(NEXT_STATUS[t.status] ?? []).map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={submit}
                    disabled={saving || !body.trim()}
                    className="ml-auto rounded-lg bg-gbrand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gbrand-dark disabled:opacity-60"
                  >
                    {saving ? 'Posting…' : 'Post follow-up'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-surface-1 p-5 shadow-card">
              <dl className="space-y-3 text-sm">
                <Row label="Priority"><PriorityBadge priority={t.priority} /></Row>
                <Row label="Requester">{t.requester}</Row>
                <Row label="Assigned to">{t.technician ?? <span className="text-ink-3">Unassigned</span>}</Row>
                <Row label="SLA">{t.sla}</Row>
                <Row label="Opened">{fmtDateTime(t.openedAt)}</Row>
                <Row label="Due">{fmtDateTime(t.dueAt)}</Row>
                {t.solvedAt && <Row label="Solved">{fmtDateTime(t.solvedAt)}</Row>}
              </dl>
            </div>
            {t.asset && (
              <div className="rounded-2xl bg-surface-1 p-5 shadow-card">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Linked asset</p>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gbrand-light text-lg">{t.asset.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{t.asset.name}</p>
                    <p className="text-xs text-ink-3">{t.asset.type}</p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </AppShell>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-3">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}
