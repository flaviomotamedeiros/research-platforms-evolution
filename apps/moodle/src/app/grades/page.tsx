'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/client/api'

interface FeedbackItem {
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

function pctColor(p: number | null): string {
  if (p === null) return 'text-slate-400'
  if (p >= 70) return 'text-green-600'
  if (p >= 50) return 'text-amber-600'
  return 'text-red-600'
}

export default function GradesPage() {
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)

  useEffect(() => {
    api<Report>('/me/grades')
      .then(setReport)
      .catch(() => router.push('/login'))
  }, [router])

  if (!report) return null

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">My grades &amp; feedback</h1>
        <Link href="/dashboard" className="text-sm text-brand hover:underline">← Dashboard</Link>
      </div>

      {/* read-contract summary — report/myfeedback */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {[
          ['Activities', report.stats.total],
          ['Graded', report.stats.graded],
          ['Pending', report.stats.pending],
          ['Average', report.stats.average !== null ? `${report.stats.average}%` : '—'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-brand">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Course</th>
              <th className="p-3">Activity</th>
              <th className="p-3">Grade</th>
              <th className="p-3">Feedback</th>
            </tr>
          </thead>
          <tbody>
            {report.items.map((it, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="p-3">{it.courseName}</td>
                <td className="p-3">{it.activityName}</td>
                <td className={`p-3 font-semibold ${pctColor(it.percentage)}`}>
                  {it.grade !== null ? `${it.grade}/${it.maxGrade} (${it.percentage}%)` : '—'}
                </td>
                <td className="p-3 text-slate-500 italic">{it.feedback ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
