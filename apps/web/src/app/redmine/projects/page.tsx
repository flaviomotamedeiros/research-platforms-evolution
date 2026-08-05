'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/redmine/client/api'
import { AppShell } from '@/components/redmine/shell'
import { Skeleton } from '@/components/redmine/ui'
import { Progress } from '@/components/redmine/redmine-ui'

interface Project { id: string; name: string; identifier: string; description: string; status: string; openIssues: number; progress: number }

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null)
  useEffect(() => { api<Project[]>('/projects').then(setProjects).catch(() => {}) }, [])

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="mt-1 text-sm text-ink-3">Every project with its open issues and overall progress.</p>
      </div>
      {projects ? (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/redmine/projects/${p.id}`} className="group block rounded-2xl bg-surface-1 p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold group-hover:text-rbrand">{p.name}</h2>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{p.identifier}</p>
                </div>
                <span className="shrink-0 rounded-full bg-surface-0 px-2.5 py-1 text-xs font-medium text-ink-2">{p.openIssues} open</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-ink-2">{p.description}</p>
              <div className="mt-4"><Progress pct={p.progress} /></div>
            </Link>
          ))}
        </div>
      ) : <Skeleton className="h-64" />}
    </AppShell>
  )
}
