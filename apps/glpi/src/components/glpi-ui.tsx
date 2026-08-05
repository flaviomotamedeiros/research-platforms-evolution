'use client'

/* GLPI-specific presentation helpers: ticket status and priority badges. */

const STATUS: Record<string, { label: string; className: string }> = {
  new:      { label: 'New',      className: 'bg-brand-light text-brand-dark' },
  assigned: { label: 'Assigned', className: 'bg-[#e8ebff] text-[#2a3eb1]' },
  pending:  { label: 'Pending',  className: 'bg-[#fff4e0] text-[#8a5a00]' },
  solved:   { label: 'Solved',   className: 'bg-teal-light text-teal-dark' },
  closed:   { label: 'Closed',   className: 'bg-surface-0 text-ink-3' },
}

const PRIORITY: Record<string, { label: string; dot: string }> = {
  critical: { label: 'Critical', dot: 'var(--status-critical)' },
  high:     { label: 'High',     dot: 'var(--status-serious)' },
  medium:   { label: 'Medium',   dot: 'var(--status-warning)' },
  low:      { label: 'Low',      dot: 'var(--series-3)' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, className: 'bg-surface-0 text-ink-3' }
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${s.className}`}>
      {s.label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const p = PRIORITY[priority] ?? { label: priority, dot: 'var(--ink-3)' }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2">
      <span className="h-2 w-2 rounded-full" style={{ background: p.dot }} />
      {p.label}
    </span>
  )
}

export function SlaChip({ breaching }: { breaching: boolean }) {
  if (breaching) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-light px-2.5 py-1 text-xs font-semibold text-status-critical">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-status-critical text-[10px] font-bold text-white">!</span>
        SLA breached
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-light px-2.5 py-1 text-xs font-semibold text-teal-dark">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-status-good text-[10px] font-bold text-white">✓</span>
      Within SLA
    </span>
  )
}

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
