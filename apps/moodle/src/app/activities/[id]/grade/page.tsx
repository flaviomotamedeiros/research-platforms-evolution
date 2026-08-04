'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '@/lib/client/api'
import { AppShell } from '@/components/shell'
import { Skeleton, StatTile } from '@/components/ui'

interface View {
  activity: { id: string; name: string; courseId: string; dueDate: string | null }
  rows: Array<{ userId: string; name: string; value: number | null; maxValue: number; feedback: string | null }>
}

export default function GradeEntryPage() {
  const params = useParams<{ id: string }>()
  const [view, setView] = useState<View | null>(null)
  const [edits, setEdits] = useState<Record<string, { value: string; feedback: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<View>(`/activities/${params.id}/grades`)
      .then((v) => {
        setView(v)
        setEdits(
          Object.fromEntries(
            v.rows.map((r) => [r.userId, { value: r.value?.toString() ?? '', feedback: r.feedback ?? '' }]),
          ),
        )
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Falha ao carregar'))
  }, [params.id])

  async function save(userId: string) {
    const edit = edits[userId]
    const value = parseFloat(edit.value)
    if (Number.isNaN(value) || value < 0 || value > 100) return
    setSaving(userId)
    try {
      await api(`/activities/${params.id}/grades`, {
        method: 'POST',
        body: JSON.stringify({ userId, value, feedback: edit.feedback }),
      })
      setSaved((s) => ({ ...s, [userId]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [userId]: false })), 2000)
    } finally {
      setSaving(null)
    }
  }

  const graded = view?.rows.filter((r) => r.value !== null).length ?? 0

  return (
    <AppShell>
      <div className="mb-8">
        {view ? (
          <>
            <Link href={`/courses/${view.activity.courseId}`} className="text-sm font-medium text-brand hover:underline">
              ← Voltar ao curso
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{view.activity.name}</h1>
            <p className="mt-1 text-sm text-ink-3">
              Lançamento de notas e feedback — contrato de escrita do módulo de avaliação.
            </p>
          </>
        ) : (
          <Skeleton className="h-9 w-96" />
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-status-critical/30 bg-status-critical/5 p-4 text-sm">
          {error} — apenas o professor do curso pode lançar notas.
        </div>
      )}

      {view && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatTile label="Alunos" value={view.rows.length} />
            <StatTile label="Corrigidas" value={graded} accent />
            <StatTile label="Pendentes" value={view.rows.length - graded} />
          </div>

          <section className="overflow-hidden rounded-2xl bg-surface-1 shadow-card">
            <ul className="divide-y divide-black/5">
              {view.rows.map((r) => {
                const edit = edits[r.userId] ?? { value: '', feedback: '' }
                return (
                  <li key={r.userId} className="grid gap-3 px-6 py-4 lg:grid-cols-[200px_110px_1fr_auto] lg:items-center">
                    <p className="text-sm font-semibold">{r.name}</p>
                    <div>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        placeholder="0–100"
                        value={edit.value}
                        onChange={(e) => setEdits((s) => ({ ...s, [r.userId]: { ...edit, value: e.target.value } }))}
                        className="w-full rounded-lg border border-black/10 bg-surface-0 px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-brand/40"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Feedback para o aluno…"
                      value={edit.feedback}
                      onChange={(e) => setEdits((s) => ({ ...s, [r.userId]: { ...edit, feedback: e.target.value } }))}
                      className="w-full rounded-lg border border-black/10 bg-surface-0 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
                    />
                    <button
                      onClick={() => save(r.userId)}
                      disabled={saving === r.userId}
                      className={`justify-self-end rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        saved[r.userId]
                          ? 'bg-status-good text-white'
                          : 'bg-brand text-white hover:bg-brand-dark disabled:opacity-60'
                      }`}
                    >
                      {saved[r.userId] ? '✓ Salvo' : saving === r.userId ? 'Salvando…' : 'Salvar'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}
    </AppShell>
  )
}
