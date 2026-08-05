'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '@/lib/moodle/client/api'
import { AppShell } from '@/components/moodle/shell'
import { Bar, Skeleton, StatusChip } from '@/components/moodle/ui'

interface Detail {
  id: string
  fullName: string
  shortName: string
  teacher: string
  role: 'student' | 'teacher'
  studentCount: number
  sections: Array<{
    id: string
    name: string
    summary: string
    materials: Array<{
      id: string
      title: string
      plugin: { id: string; displayName: string; icon: string }
      display: { medium: 'html' | 'embed' | 'link'; html?: string; embedUrl?: string; url?: string; note?: string }
    }>
    activities: Array<{
      id: string; name: string; description: string; dueDate: string | null
      myGrade: number | null; myMax: number | null; myFeedback: string | null
      gradedCount: number; expectedCount: number
    }>
  }>
  lessonPlan: Array<{ id: string; date: string; topic: string; held: boolean }>
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** Generic renderer for whatever medium a content plugin returns. */
function MaterialBody({ display, title }: {
  display: { medium: string; html?: string; embedUrl?: string; note?: string }
  title: string
}) {
  if (display.medium === 'embed' && display.embedUrl) {
    return (
      <div className="mx-6 mb-4">
        <div className="overflow-hidden rounded-xl bg-black" style={{ aspectRatio: '16 / 9' }}>
          <iframe
            className="h-full w-full"
            src={display.embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {display.note && <p className="mt-2 text-xs text-ink-3">{display.note}</p>}
      </div>
    )
  }
  return (
    <article
      className="lesson-page mx-6 mb-5 rounded-xl bg-surface-0 p-6"
      dangerouslySetInnerHTML={{ __html: display.html ?? '' }}
    />
  )
}

export default function CoursePage() {
  const params = useParams<{ id: string }>()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [openMaterial, setOpenMaterial] = useState<string | null>(null)
  const [tab, setTab] = useState<'content' | 'plan'>('content')

  useEffect(() => {
    api<Detail>(`/courses/${params.id}`).then(setDetail).catch(() => {})
  }, [params.id])

  const isTeacher = detail?.role === 'teacher'
  const heldCount = detail?.lessonPlan.filter((l) => l.held).length ?? 0

  return (
    <AppShell>
      <div className="mb-6">
        <Link href="/moodle/dashboard" className="text-sm font-medium text-mbrand hover:underline">
          ← Dashboard
        </Link>
        {detail ? (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{detail.fullName}</h1>
              <span className="rounded-full bg-mbrand-light px-3 py-1 text-xs font-bold text-mbrand-dark">
                {detail.shortName}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-3">
              {isTeacher ? `You teach this course · ${detail.studentCount} students` : `Prof. ${detail.teacher}`} ·{' '}
              {heldCount} of {detail.lessonPlan.length} classes held
            </p>
          </>
        ) : (
          <Skeleton className="mt-2 h-9 w-96" />
        )}
      </div>

      {/* Teacher quick actions */}
      {isTeacher && (
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href={`/moodle/courses/${params.id}/attendance`}
            className="rounded-xl bg-mbrand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-mbrand-dark"
          >
            Attendance ledger
          </Link>
          <span className="rounded-xl border border-black/10 bg-surface-1 px-4 py-2 text-sm text-ink-2">
            Grading: open an activity below and use “Enter grades”
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-surface-1 p-1 shadow-card sm:w-fit">
        {(['content', 'plan'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'bg-mbrand text-white' : 'text-ink-2 hover:text-ink-1'
            }`}
          >
            {t === 'content' ? 'Content' : `Lesson plan (${detail?.lessonPlan.length ?? '…'})`}
          </button>
        ))}
      </div>

      {!detail && <Skeleton className="h-64" />}

      {/* ── Content: sections with materials + activities ── */}
      {detail && tab === 'content' && (
        <div className="space-y-6">
          {detail.sections.map((s) => (
            <section key={s.id} className="overflow-hidden rounded-2xl bg-surface-1 shadow-card">
              <header className="border-b border-black/5 px-6 py-4">
                <h2 className="text-base font-bold">{s.name}</h2>
                <p className="text-sm text-ink-3">{s.summary}</p>
              </header>
              <ul className="divide-y divide-black/5">
                {s.materials.map((m) => {
                  if (m.display.medium === 'link') {
                    return (
                      <li key={m.id}>
                        <a
                          href={m.display.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-surface-0"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-series-3/10 text-sm">{m.plugin.icon}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{m.title}</span>
                            <span className="text-xs text-ink-3">{m.plugin.displayName}</span>
                          </span>
                          <span className="ml-auto shrink-0 text-xs text-ink-3">open ↗</span>
                        </a>
                      </li>
                    )
                  }
                  const open = openMaterial === m.id
                  return (
                    <li key={m.id}>
                      <button
                        onClick={() => setOpenMaterial(open ? null : m.id)}
                        className="flex w-full items-center gap-3 px-6 py-3.5 text-left transition-colors hover:bg-surface-0"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mbrand-light text-sm">{m.plugin.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{m.title}</span>
                          <span className="text-xs text-ink-3">{m.plugin.displayName}</span>
                        </span>
                        <span className="ml-auto shrink-0 text-xs text-ink-3">
                          {open ? 'close ▲' : 'open ▼'}
                        </span>
                      </button>
                      {open && <MaterialBody display={m.display} title={m.title} />}
                    </li>
                  )
                })}
                {s.activities.map((a) => (
                  <li key={a.id} className="px-6 py-3.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-series-2/10 text-sm">📝</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{a.name}</p>
                        <p className="text-xs text-ink-3">
                          {a.dueDate ? `Due ${fmtDate(a.dueDate)}` : 'No due date'} · {a.description}
                        </p>
                      </div>
                      {detail.role === 'student' && (
                        <div className="w-40 shrink-0">
                          {a.myGrade !== null && a.myMax ? (
                            <>
                              <div className="mb-1 flex justify-between text-xs">
                                <span className="text-ink-3">{a.myGrade}/{a.myMax}</span>
                                <span className="font-bold tabular-nums">{Math.round((a.myGrade / a.myMax) * 100)}%</span>
                              </div>
                              <Bar pct={(a.myGrade / a.myMax) * 100} />
                            </>
                          ) : (
                            <span className="text-xs text-ink-3">Not graded yet</span>
                          )}
                        </div>
                      )}
                      {isTeacher && (
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-xs tabular-nums text-ink-2">
                            {a.gradedCount}/{a.expectedCount} graded
                          </span>
                          <Link
                            href={`/moodle/activities/${a.id}/grade`}
                            className="rounded-lg bg-mbrand-light px-3 py-1.5 text-xs font-semibold text-mbrand-dark transition-colors hover:bg-mbrand hover:text-white"
                          >
                            Enter grades
                          </Link>
                        </div>
                      )}
                    </div>
                    {detail.role === 'student' && a.myFeedback && (
                      <p className="ml-11 mt-2 border-l-2 border-track pl-3 text-sm italic text-ink-2">
                        “{a.myFeedback}”
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* ── Lesson plan ── */}
      {detail && tab === 'plan' && (
        <section className="overflow-hidden rounded-2xl bg-surface-1 shadow-card">
          <header className="border-b border-black/5 px-6 py-4">
            <h2 className="text-base font-bold">Lesson plan — 2026.1 semester</h2>
            <p className="text-xs text-ink-3">{heldCount} held · {detail.lessonPlan.length - heldCount} scheduled</p>
          </header>
          <ul className="divide-y divide-black/5">
            {detail.lessonPlan.map((l, i) => (
              <li key={l.id} className={`flex items-center gap-4 px-6 py-3 ${l.held ? '' : 'opacity-70'}`}>
                <span className="w-8 shrink-0 text-right text-xs tabular-nums text-ink-3">{i + 1}</span>
                <span className="w-16 shrink-0 text-xs font-medium tabular-nums text-ink-2">{fmtDate(l.date)}</span>
                <span className="flex-1 text-sm">{l.topic}</span>
                {l.held ? (
                  <StatusChip kind="good" label="Held" />
                ) : (
                  <span className="rounded-full bg-surface-0 px-2.5 py-1 text-xs font-medium text-ink-3">Scheduled</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  )
}
