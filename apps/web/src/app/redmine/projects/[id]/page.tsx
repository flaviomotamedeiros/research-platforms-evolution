'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '@/lib/redmine/client/api'
import { AppShell } from '@/components/redmine/shell'
import { Skeleton } from '@/components/redmine/ui'
import { StatusBadge, PriorityBadge, TrackerBadge, Progress } from '@/components/redmine/redmine-ui'

interface Project { id: string; name: string; identifier: string; description: string; progress: number }
interface Issue {
  id: string; subject: string; status: string; priority: string; doneRatio: number
  assignee: string | null; tracker: { id: string; label: string; icon: string; colour: string }; overdue: boolean
}

const FILTERS = [
  { key: 'open', label: 'Open' },
  { key: 'all', label: 'All' },
  { key: 'closed', label: 'Closed' },
] as const

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [issues, setIssues] = useState<Issue[] | null>(null)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('open')

  useEffect(() => {
    api<Project[]>('/projects').then((ps) => setProject(ps.find((p) => p.id === params.id) ?? null)).catch(() => {})
    api<Issue[]>(`/projects/${params.id}/issues`).then(setIssues).catch(() => {})
  }, [params.id])

  const shown = (issues ?? []).filter((i) => {
    if (filter === 'open') return i.status !== 'closed'
    if (filter === 'closed') return i.status === 'closed'
    return true
  })

  return (
    <AppShell>
      <div className="mb-6">
        <Link href="/redmine/projects" className="text-sm font-medium text-rbrand hover:underline">← Projects</Link>
        {project ? (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <span className="rounded-full bg-rbrand-light px-3 py-1 text-xs font-bold text-rbrand-dark">{project.identifier}</span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-ink-2">{project.description}</p>
            <div className="mt-4 max-w-md"><Progress pct={project.progress} /></div>
          </>
        ) : <Skeleton className="mt-2 h-9 w-96" />}
      </div>

      <div className="mb-4 flex gap-1 rounded-xl bg-surface-1 p-1 shadow-card sm:w-fit">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === f.key ? 'bg-rbrand text-white' : 'text-ink-2 hover:text-ink-1'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-surface-1 shadow-card">
        {issues ? (
          <ul className="divide-y divide-black/5">
            {shown.map((i) => (
              <li key={i.id}>
                <Link href={`/redmine/issues/${i.id}`} className="grid gap-3 px-6 py-4 transition-colors hover:bg-surface-0 lg:grid-cols-[1fr_180px]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <TrackerBadge tracker={i.tracker} />
                      <span className="min-w-0 truncate text-sm font-semibold">{i.subject}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-ink-3">
                      <PriorityBadge priority={i.priority} />
                      <span>{i.assignee ? `→ ${i.assignee}` : 'unassigned'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1"><Progress pct={i.doneRatio} /></div>
                    <StatusBadge status={i.status} />
                  </div>
                </Link>
              </li>
            ))}
            {shown.length === 0 && <li className="px-6 py-10 text-center text-sm text-ink-3">No issues in this view.</li>}
          </ul>
        ) : <div className="p-6"><Skeleton className="h-64" /></div>}
      </div>
    </AppShell>
  )
}
