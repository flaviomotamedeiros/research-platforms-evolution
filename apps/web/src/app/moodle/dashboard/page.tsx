'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/moodle/client/api'
import { AppShell } from '@/components/moodle/shell'
import { StatTile, Bar, Ring, StatusChip, Skeleton } from '@/components/moodle/ui'

interface Me { name: string; role: string }
interface Course {
  id: string; fullName: string; shortName: string; role: string; teacher: string
  activityCount: number; studentCount: number; toGrade: number
}
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

  const isTeacher = me?.role === 'teacher'
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

  const totalStudents = (courses ?? []).reduce((s, c) => s + c.studentCount, 0)
  const totalToGrade = (courses ?? []).reduce((s, c) => s + c.toGrade, 0)

  const firstName = me?.name.split(' ')[0]
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm capitalize text-ink-3">{today}</p>
        <h1 className="text-3xl font-bold tracking-tight">
          {firstName ? `Hello, ${firstName}` : <Skeleton className="h-9 w-48" />}
        </h1>
      </div>

      {/* Student: attendance alert */}
      {!isTeacher && nonCompliant.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-status-critical/30 bg-status-critical/5 p-4">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-critical text-xs font-bold text-white">
            !
          </span>
          <div>
            <p className="text-sm font-semibold">Attendance below the 75% legal minimum</p>
            <p className="text-sm text-ink-2">
              {nonCompliant.length === 1 ? 'One course is' : `${nonCompliant.length} courses are`} below the minimum
              required by the Brazilian education law (LDB, art. 24 VI). Contact your programme coordinator.
            </p>
          </div>
        </div>
      )}

      {/* Teacher: pending grading alert */}
      {isTeacher && courses && totalToGrade > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-status-warning/40 bg-status-warning/10 p-4">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-warning text-xs font-bold text-white">
            !
          </span>
          <div>
            <p className="text-sm font-semibold">You have {totalToGrade} submissions to grade</p>
            <p className="text-sm text-ink-2">Open a course and use “Enter grades” on the corresponding activity.</p>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {courses && report && attendance ? (
          isTeacher ? (
            <>
              <StatTile label="Courses" value={courses.length} hint="you teach" />
              <StatTile label="Students" value={totalStudents} hint="enrolled in your courses" />
              <StatTile label="Activities" value={courses.reduce((s, c) => s + c.activityCount, 0)} />
              <StatTile label="To grade" value={totalToGrade} accent hint="ungraded submissions" />
            </>
          ) : (
            <>
              <StatTile label="Courses" value={courses.length} hint="active enrolments" />
              <StatTile label="Overall average" value={report.stats.average !== null ? `${report.stats.average}%` : '—'} accent hint={`${report.stats.graded} graded activities`} />
              <StatTile label="Attendance rate" value={avgAttendance !== null ? `${avgAttendance}%` : '—'} hint="legal minimum: 75%" />
              <StatTile label="Pending" value={report.stats.pending} hint="activities not graded yet" />
            </>
          )
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        )}
      </div>

      {/* Course cards */}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">My courses</h2>
        {!isTeacher && (
          <Link href="/moodle/grades" className="text-sm font-medium text-mbrand hover:underline">
            View all grades →
          </Link>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {courses ? (
          courses.map((c) => {
            const att = attByCourse.get(c.id)
            const avg = courseAvg(c.id)
            const student = c.role === 'student'
            return (
              <Link
                key={c.id}
                href={`/moodle/courses/${c.id}`}
                className="group block rounded-2xl bg-surface-1 p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{c.shortName}</p>
                    <h3 className="truncate text-base font-bold group-hover:text-mbrand">{c.fullName}</h3>
                    <p className="mt-0.5 text-sm text-ink-3">
                      {student
                        ? `${c.teacher} · ${c.activityCount} activities`
                        : `${c.studentCount} students · ${c.activityCount} activities`}
                    </p>
                  </div>
                  {att && student && (
                    <div className="shrink-0 text-center">
                      <Ring pct={att.rate} color={att.compliant ? 'var(--series-1)' : 'var(--status-critical)'} />
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-ink-3">Attendance</p>
                    </div>
                  )}
                </div>

                {student && avg !== null && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-ink-3">Course average</span>
                      <span className="font-semibold tabular-nums">{avg}%</span>
                    </div>
                    <Bar pct={avg} />
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  {student && att ? (
                    att.compliant ? (
                      <StatusChip kind="good" label="Attendance OK" />
                    ) : (
                      <StatusChip kind="critical" label={`${att.absent} absences — below 75%`} />
                    )
                  ) : !student ? (
                    c.toGrade > 0 ? (
                      <StatusChip kind="warning" label={`${c.toGrade} to grade`} />
                    ) : (
                      <StatusChip kind="good" label="Grading up to date" />
                    )
                  ) : (
                    <span />
                  )}
                  <span className="text-sm font-medium text-mbrand opacity-0 transition-opacity group-hover:opacity-100">
                    Open course →
                  </span>
                </div>
              </Link>
            )
          })
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44" />)
        )}
      </div>
    </AppShell>
  )
}
