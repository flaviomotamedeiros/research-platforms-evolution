'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client/api'
import { AppShell } from '@/components/shell'
import { StatTile, Bar, Skeleton } from '@/components/ui'

interface FeedbackItem {
  courseId: string
  courseName: string
  activityName: string
  grade: number | null
  maxGrade: number
  percentage: number | null
  feedback: string | null
}
interface Report {
  items: FeedbackItem[]
  stats: { total: number; graded: number; pending: number; average: number | null }
}

export default function GradesPage() {
  const [report, setReport] = useState<Report | null>(null)

  useEffect(() => {
    api<Report>('/me/grades').then(setReport).catch(() => {})
  }, [])

  const byCourse = new Map<string, FeedbackItem[]>()
  for (const it of report?.items ?? []) {
    const arr = byCourse.get(it.courseName) ?? []
    arr.push(it)
    byCourse.set(it.courseName, arr)
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Grades & feedback</h1>
        <p className="mt-1 text-sm text-ink-3">
          A consolidated view of every activity — the read contract{' '}
          <code className="rounded bg-surface-1 px-1.5 py-0.5 text-xs">report/myfeedback</code>.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {report ? (
          <>
            <StatTile label="Activities" value={report.stats.total} />
            <StatTile label="Graded" value={report.stats.graded} />
            <StatTile label="Pending" value={report.stats.pending} />
            <StatTile label="Overall average" value={report.stats.average !== null ? `${report.stats.average}%` : '—'} accent />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        )}
      </div>

      {report ? (
        <div className="space-y-6">
          {[...byCourse.entries()].map(([courseName, items]) => {
            const graded = items.filter((i) => i.percentage !== null)
            const avg = graded.length
              ? Math.round(graded.reduce((s, i) => s + (i.percentage ?? 0), 0) / graded.length)
              : null
            return (
              <section key={courseName} className="overflow-hidden rounded-2xl bg-surface-1 shadow-card">
                <header className="flex items-baseline justify-between border-b border-black/5 px-6 py-4">
                  <h2 className="text-base font-bold">{courseName}</h2>
                  {avg !== null && (
                    <span className="text-sm text-ink-2">
                      average <span className="font-bold tabular-nums text-ink-1">{avg}%</span>
                    </span>
                  )}
                </header>
                <ul className="divide-y divide-black/5">
                  {items.map((it, i) => (
                    <li key={i} className="grid gap-3 px-6 py-4 sm:grid-cols-[1fr_220px] sm:items-center">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{it.activityName}</p>
                        {it.feedback ? (
                          <p className="mt-1 border-l-2 border-track pl-3 text-sm italic text-ink-2">
                            “{it.feedback}”
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-ink-3">Awaiting grading</p>
                        )}
                      </div>
                      <div>
                        {it.percentage !== null ? (
                          <>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-ink-3">
                                {it.grade}/{it.maxGrade}
                              </span>
                              <span className="font-bold tabular-nums">{it.percentage}%</span>
                            </div>
                            <Bar pct={it.percentage} />
                          </>
                        ) : (
                          <span className="inline-block rounded-full bg-surface-0 px-2.5 py-1 text-xs font-medium text-ink-3">
                            Not graded
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      ) : (
        <Skeleton className="h-64" />
      )}
    </AppShell>
  )
}
