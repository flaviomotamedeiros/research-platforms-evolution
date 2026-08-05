'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '@/lib/redmine/client/api'
import { AppShell } from '@/components/redmine/shell'
import { Skeleton } from '@/components/redmine/ui'
import { StatusBadge, PriorityBadge, TrackerBadge, Progress, fmtDate, fmtDateTime } from '@/components/redmine/redmine-ui'

interface SpecField { label: string; value: string }
interface Detail {
  id: string; projectId: string; projectName: string; subject: string; description: string
  status: string; priority: string; doneRatio: number; author: string; assignee: string | null
  estimatedHours: number | null; spentHours: number; createdAt: string; dueDate: string | null; overdue: boolean
  tracker: { id: string; label: string; icon: string; colour: string }
  fields: SpecField[]
  journals: Array<{ id: string; author: string; notes: string; detail: string | null; createdAt: string }>
  canUpdate: boolean
}

const NEXT: Record<string, Array<{ value: string; label: string }>> = {
  new:         [{ value: 'in_progress', label: 'Start' }, { value: 'closed', label: 'Close' }],
  in_progress: [{ value: 'resolved', label: 'Mark resolved' }, { value: 'feedback', label: 'Request feedback' }, { value: 'closed', label: 'Close' }],
  feedback:    [{ value: 'in_progress', label: 'Resume' }, { value: 'closed', label: 'Close' }],
  resolved:    [{ value: 'closed', label: 'Close' }],
  closed:      [],
}

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>()
  const [t, setT] = useState<Detail | null>(null)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')
  const [ratio, setRatio] = useState('')
  const [hours, setHours] = useState('')
  const [assign, setAssign] = useState(false)
  const [saving, setSaving] = useState(false)

  function load() { api<Detail>(`/issues/${params.id}`).then((d) => { setT(d); setStatus(''); setRatio(''); setHours('') }).catch(() => {}) }
  useEffect(load, [params.id])

  async function submit() {
    if (!notes.trim()) return
    setSaving(true)
    try {
      await api(`/issues/${params.id}/update`, {
        method: 'POST',
        body: JSON.stringify({
          notes,
          newStatus: status || undefined,
          doneRatio: ratio ? Number(ratio) : undefined,
          logHours: hours ? Number(hours) : undefined,
          assignToSelf: assign || undefined,
        }),
      })
      setNotes(''); setAssign(false)
      load()
    } finally { setSaving(false) }
  }

  return (
    <AppShell>
      {!t ? <Skeleton className="h-96" /> : (
        <>
          <Link href={`/redmine/projects/${t.projectId}`} className="text-sm font-medium text-rbrand hover:underline">← {t.projectName}</Link>
          <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_300px]">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <TrackerBadge tracker={t.tracker} />
                <h1 className="text-2xl font-bold tracking-tight">{t.subject}</h1>
                <StatusBadge status={t.status} />
              </div>
              <div className="rounded-2xl bg-surface-1 p-6 shadow-card">
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">{t.description}</p>
              </div>

              <h2 className="mb-3 mt-8 text-lg font-bold">History ({t.journals.length})</h2>
              <div className="space-y-3">
                {t.journals.map((j) => (
                  <div key={j.id} className="rounded-2xl bg-surface-1 p-4 shadow-card">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-semibold">{j.author}</span>
                      <span className="text-xs text-ink-3">{fmtDateTime(j.createdAt)}</span>
                    </div>
                    {j.detail && <p className="mb-1 text-xs font-medium text-rbrand-dark">{j.detail}</p>}
                    <p className="whitespace-pre-line text-sm text-ink-2">{j.notes}</p>
                  </div>
                ))}
                {t.journals.length === 0 && <p className="rounded-2xl bg-surface-1 p-4 text-sm text-ink-3 shadow-card">No updates yet.</p>}
              </div>

              {t.canUpdate && t.status !== 'closed' && (
                <div className="mt-4 rounded-2xl bg-surface-1 p-4 shadow-card">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Add a note…"
                    className="w-full resize-y rounded-xl border border-black/10 bg-surface-0 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rbrand/40" />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <select value={status} onChange={(e) => setStatus(e.target.value)}
                      className="rounded-lg border border-black/10 bg-surface-0 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rbrand/40">
                      <option value="">Keep status</option>
                      {(NEXT[t.status] ?? []).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <input type="number" min={0} max={100} step={10} value={ratio} onChange={(e) => setRatio(e.target.value)} placeholder="Progress %"
                      className="rounded-lg border border-black/10 bg-surface-0 px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-rbrand/40" />
                    <input type="number" min={0} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Log hours"
                      className="rounded-lg border border-black/10 bg-surface-0 px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-rbrand/40" />
                    {!t.assignee && (
                      <label className="flex items-center gap-2 text-sm text-ink-2">
                        <input type="checkbox" checked={assign} onChange={(e) => setAssign(e.target.checked)} /> Assign to me
                      </label>
                    )}
                  </div>
                  <button onClick={submit} disabled={saving || !notes.trim()}
                    className="mt-3 w-full rounded-lg bg-rbrand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rbrand-dark disabled:opacity-60">
                    {saving ? 'Saving…' : 'Submit update'}
                  </button>
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl bg-surface-1 p-5 shadow-card">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3">Progress</p>
                <Progress pct={t.doneRatio} />
                <dl className="mt-4 space-y-3 text-sm">
                  <Row label="Priority"><PriorityBadge priority={t.priority} /></Row>
                  <Row label="Author">{t.author}</Row>
                  <Row label="Assignee">{t.assignee ?? <span className="text-ink-3">Unassigned</span>}</Row>
                  <Row label="Estimated">{t.estimatedHours != null ? `${t.estimatedHours}h` : '—'}</Row>
                  <Row label="Spent">{t.spentHours}h</Row>
                  <Row label="Created">{fmtDate(t.createdAt)}</Row>
                  <Row label="Due">{t.dueDate ? fmtDate(t.dueDate) : '—'}</Row>
                </dl>
              </div>
              {t.fields.length > 0 && (
                <div className="rounded-2xl bg-surface-1 p-5 shadow-card">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">{t.tracker.label} fields</p>
                  <dl className="space-y-2">
                    {t.fields.map((f) => (
                      <div key={f.label} className="flex items-center justify-between gap-3 text-sm">
                        <dt className="text-ink-3">{f.label}</dt>
                        <dd className="text-right font-medium">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </aside>
          </div>
        </>
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
