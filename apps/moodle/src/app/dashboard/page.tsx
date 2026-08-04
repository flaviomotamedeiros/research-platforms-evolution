'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, setToken } from '@/lib/client/api'

interface Me {
  name: string
  role: string
}
interface Course {
  id: string
  fullName: string
  shortName: string
  role: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api<Me>('/me'), api<Course[]>('/me/courses')])
      .then(([m, cs]) => {
        setMe(m)
        setCourses(cs)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load')
        router.push('/login')
      })
  }, [router])

  function logout() {
    setToken(null)
    router.push('/login')
  }

  if (error) return null

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">Dashboard</h1>
          {me && <p className="text-sm text-slate-500">{me.name} · {me.role}</p>}
        </div>
        <div className="flex gap-3">
          <Link href="/grades" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
            My grades
          </Link>
          <button onClick={logout} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
            Sign out
          </button>
        </div>
      </header>

      <h2 className="mb-3 text-lg font-semibold">My courses</h2>
      <ul className="space-y-2">
        {courses.map((c) => (
          <li key={c.id} className="rounded-lg bg-white p-4 shadow-sm">
            <p className="font-medium">{c.fullName}</p>
            <p className="text-sm text-slate-500">{c.shortName} · {c.role}</p>
          </li>
        ))}
        {courses.length === 0 && <p className="text-sm text-slate-500">No enrolments.</p>}
      </ul>
    </main>
  )
}
