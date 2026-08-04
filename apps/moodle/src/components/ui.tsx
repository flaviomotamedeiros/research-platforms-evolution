'use client'

/* Shared UI primitives. Charts follow the validated palette:
   magnitude = sequential blue on a neutral track; status = fixed palette,
   always icon + label (never color alone); text wears ink tokens. */

export function StatTile({ label, value, hint, accent = false }: {
  label: string; value: string | number; hint?: string; accent?: boolean
}) {
  return (
    <div className="rounded-2xl bg-surface-1 p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${accent ? 'text-brand' : 'text-ink-1'}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  )
}

/** Horizontal magnitude bar — 4px rounded data end, neutral track, value label. */
export function Bar({ pct, color = 'var(--series-1)' }: { pct: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-track">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }}
      />
    </div>
  )
}

/** SVG progress ring for attendance rate. */
export function Ring({ pct, size = 56, stroke = 6, color = 'var(--series-1)' }: {
  pct: number; size?: number; stroke?: number; color?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${clamped}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - clamped / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        className="fill-ink-1 text-sm font-bold tabular-nums" style={{ fontSize: size * 0.26 }}
      >
        {clamped}%
      </text>
    </svg>
  )
}

/** Status chip — icon + label, never color alone. */
export function StatusChip({ kind, label }: { kind: 'good' | 'warning' | 'critical'; label: string }) {
  const map = {
    good:     { color: 'var(--status-good)',     icon: '✓' },
    warning:  { color: 'var(--status-warning)',  icon: '!' },
    critical: { color: 'var(--status-critical)', icon: '✕' },
  }[kind]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-0 px-2.5 py-1 text-xs font-semibold text-ink-1">
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ background: map.color }}
        aria-hidden
      >
        {map.icon}
      </span>
      {label}
    </span>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-track ${className}`} />
}
