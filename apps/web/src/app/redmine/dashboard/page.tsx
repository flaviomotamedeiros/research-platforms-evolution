'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/redmine/client/api'
import { AppShell } from '@/components/redmine/shell'
import { StatTile, Skeleton } from '@/components/redmine/ui'
import { StatusBadge, PriorityBadge, TrackerBadge, Progress } from '@/components/redmine/redmine-ui'

interface Me { name: string; role: string }
interface Project { id: string; name: string; identifier: string; openIssues: number; progress: number }
interface MyIssue {
  id: string; subject: string; status: string; priority: string; doneRatio: number
  tracker: { label: string; icon: string; colour: string }; overdue: boolean; projectName: string
}

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [mine, setMine] = useState<MyIssue[] | null>(null)

  useEffect(() => {
    api<Me>('/me').then(setMe).catch(() => {})
    api<Project[]>('/projects').then(setProjects).catch(() => {})
    api<MyIssue[]>('/me/issues').then(setMine).catch(() => {})
  }, [])

  const firstName = me?.name.split(' ')[0]
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const openMine = (mine ?? []).filter((i) => i.status !== 'closed')
  const overdueMine = (mine ?? []).filter((i) => i.overdue)

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm capitalize text-ink-3">{today}</p>
        <h1 className="text-3xl font-bold tracking-tight">{firstName ? `Hello, ${firstName}` : <Skeleton className="h-9 w-48" />}</h1>
      </div>

      {overdueMine.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-status-critical/30 bg-status-critical/5 p-4">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-critical text-xs font-bold text-white">!</span>
          <div>
            <p className="text-sm font-semibold">{overdueMine.length} of your issues are overdue</p>
            <p className="text-sm text-ink-2">Their due date has passed and they are not closed.</p>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {projects && mine ? (
          <>
            <StatTile label="Projects" value={projects.length} />
            <StatTile label="Assigned to me" value={openMine.length} accent hint="open issues" />
            <StatTile label="Overdue" value={overdueMine.length} hint="past due date" />
            <StatTile label="Open issues" value={projects.reduce((s, p) => s + p.openIssues, 0)} hint="across all projects" />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My issues */}
        <section>
          <h2 className="mb-3 text-lg font-bold">Assigned to me</h2>
          <div className="overflow-hidden rounded-2xl bg-surface-1 shadow-card">
            {mine ? (
              <ul className="divide-y divide-black/5">
                {mine.slice(0, 6).map((i) => (
                  <li key={i.id}>
                    <Link href={`/redmine/issues/${i.id}`} className="block px-5 py-3.5 transition-colors hover:bg-surface-0">
                      <div className="flex items-center gap-2">
                        <TrackerBadge tracker={i.tracker} />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{i.subject}</span>
                        <StatusBadge status={i.status} />
                      </div>
                      <div className="mt-2"><Progress pct={i.doneRatio} /></div>
                    </Link>
                  </li>
                ))}
                {mine.length === 0 && <li className="px-5 py-8 text-center text-sm text-ink-3">No issues assigned to you.</li>}
              </ul>
            ) : <div className="p-5"><Skeleton className="h-48" /></div>}
          </div>
        </section>

        {/* Projects */}
        <section>
          <h2 className="mb-3 text-lg font-bold">Projects</h2>
          <div className="space-y-3">
            {projects ? projects.map((p) => (
              <Link key={p.id} href={`/redmine/projects/${p.id}`} className="block rounded-2xl bg-surface-1 p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold">{p.name}</span>
                  <span className="text-xs text-ink-3">{p.openIssues} open</span>
                </div>
                <Progress pct={p.progress} />
              </Link>
            )) : <Skeleton className="h-40" />}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
