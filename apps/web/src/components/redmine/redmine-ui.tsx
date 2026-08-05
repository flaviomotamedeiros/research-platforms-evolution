'use client'

const STATUS: Record<string, { label: string; className: string }> = {
  new:         { label: 'New',         className: 'bg-rbrand-light text-rbrand-dark' },
  in_progress: { label: 'In progress', className: 'bg-[#fff4e0] text-[#8a5a00]' },
  resolved:    { label: 'Resolved',    className: 'bg-teal-light text-teal-dark' },
  feedback:    { label: 'Feedback',    className: 'bg-[#e8ebff] text-[#2a3eb1]' },
  closed:      { label: 'Closed',      className: 'bg-surface-0 text-ink-3' },
}

const PRIORITY: Record<string, { label: string; dot: string }> = {
  urgent: { label: 'Urgent', dot: 'var(--status-critical)' },
  high:   { label: 'High',   dot: 'var(--status-serious)' },
  normal: { label: 'Normal', dot: 'var(--status-warning)' },
  low:    { label: 'Low',    dot: 'var(--series-3)' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, className: 'bg-surface-0 text-ink-3' }
  return <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${s.className}`}>{s.label}</span>
}

export function PriorityBadge({ priority }: { priority: string }) {
  const p = PRIORITY[priority] ?? { label: priority, dot: 'var(--ink-3)' }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2">
      <span className="h-2 w-2 rounded-full" style={{ background: p.dot }} />{p.label}
    </span>
  )
}

export function TrackerBadge({ tracker }: { tracker: { label: string; icon: string; colour: string } }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold"
      style={{ background: `${tracker.colour}1a`, color: tracker.colour }}
    >
      <span>{tracker.icon}</span>{tracker.label}
    </span>
  )
}

/** Compact done-ratio bar with label. */
export function Progress({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-track">
        <div className="h-full rounded-full bg-[color:var(--series-1)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-ink-2">{pct}%</span>
    </div>
  )
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
