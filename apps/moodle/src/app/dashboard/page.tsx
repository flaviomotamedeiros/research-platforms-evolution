'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/client/api'
import { AppShell } from '@/components/shell'
import { StatTile, Bar, Ring, StatusChip, Skeleton } from '@/components/ui'

interface Me { name: string; role: string }
interface Course { id: string; fullName: string; shortName: string; role: string; teacher: string; activityCount: number }
interface Report {
  items: Array<{ courseId: string; percentage: number | null }>
  stats: { total: number; graded: number; pending: number; average: number | null }
}
interface AttRow { courseId: string; rate: number; compliant: boolean; held: number; absent: number }

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [courses, setCourses] = useState<Course[] | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [attendance, setAttendance] = useState<AttRow[] | null>(null)

  useEffect(() => {
    api<Me>('/me').then(setMe).catch(() => {})
    api<Course[]>('/me/courses').then(setCourses).catch(() => {})
    api<Report>('/me/grades').then(setReport).catch(() => {})
    api<AttRow[]>('/me/attendance').then(setAttendance).catch(() => {})
  }, [])

  const attByCourse = new Map((attendance ?? []).map((a) => [a.courseId, a]))
  const nonCompliant = (attendance ?? []).filter((a) => !a.compliant)
  const avgAttendance =
    attendance && attendance.length > 0
      ? Math.round(attendance.reduce((s, a) => s + a.rate, 0) / attendance.length)
      : null

  const courseAvg = (courseId: string): number | null => {
    const items = (report?.items ?? []).filter((i) => i.courseId === courseId && i.percentage !== null)
    if (items.length === 0) return null
    return Math.round(items.reduce((s, i) => s + (i.percentage ?? 0), 0) / items.length)
  }

  const firstName = me?.name.split(' ')[0]
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm capitalize text-ink-3">{today}</p>
        <h1 className="text-3xl font-bold tracking-tight">
          {firstName ? `Olá, ${firstName}` : <Skeleton className="h-9 w-48" />}
        </h1>
      </div>

      {/* Attendance alert — status color + icon + text, never color alone */}
      {nonCompliant.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-status-critical/30 bg-status-critical/5 p-4">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-critical text-xs font-bold text-white">
            !
          </span>
          <div>
            <p className="text-sm font-semibold">Frequência abaixo do mínimo legal (75%)</p>
            <p className="text-sm text-ink-2">
              {nonCompliant.length === 1 ? 'Um curso está' : `${nonCompliant.length} cursos estão`} abaixo do limite
              da LDB art. 24 VI. Procure a coordenação para regularizar.
            </p>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {courses && report && attendance ? (
          <>
            <StatTile label="Cursos" value={courses.length} hint="matrículas ativas" />
            <StatTile label="Média geral" value={report.stats.average !== null ? `${report.stats.average}%` : '—'} accent hint={`${report.stats.graded} atividades corrigidas`} />
            <StatTile label="Frequência média" value={avgAttendance !== null ? `${avgAttendance}%` : '—'} hint="mínimo legal: 75%" />
            <StatTile label="Pendências" value={report.stats.pending} hint="atividades sem nota" />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        )}
      </div>

      {/* Course cards */}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">Meus cursos</h2>
        <Link href="/grades" className="text-sm font-medium text-brand hover:underline">
          Ver todas as notas →
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {courses ? (
          courses.map((c) => {
            const att = attByCourse.get(c.id)
            const avg = courseAvg(c.id)
            return (
              <div key={c.id} className="group rounded-2xl bg-surface-1 p-5 shadow-card transition-shadow hover:shadow-cardHover">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{c.shortName}</p>
                    <h3 className="truncate text-base font-bold">{c.fullName}</h3>
                    <p className="mt-0.5 text-sm text-ink-3">
                      {c.role === 'teacher' ? 'Você leciona' : c.teacher} · {c.activityCount} atividades
                    </p>
                  </div>
                  {att && c.role === 'student' && (
                    <div className="shrink-0 text-center">
                      <Ring pct={att.rate} color={att.compliant ? 'var(--series-1)' : 'var(--status-critical)'} />
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-ink-3">Frequência</p>
                    </div>
                  )}
                </div>

                {c.role === 'student' && avg !== null && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-ink-3">Média no curso</span>
                      <span className="font-semibold tabular-nums">{avg}%</span>
                    </div>
                    <Bar pct={avg} />
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  {att && c.role === 'student' ? (
                    att.compliant ? (
                      <StatusChip kind="good" label="Frequência regular" />
                    ) : (
                      <StatusChip kind="critical" label={`${att.absent} faltas — abaixo de 75%`} />
                    )
                  ) : <span />}
                  {c.role === 'teacher' && (
                    <Link
                      href={`/courses/${c.id}/attendance`}
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      Diário de frequência →
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44" />)
        )}
      </div>
    </AppShell>
  )
}
