'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, setToken } from '@/lib/moodle/client/api'

const DEMO_USERS = [
  {
    username: 'pedro.ferreira',
    name: 'Pedro Ferreira',
    role: 'student' as const,
    detail: 'Enrolled in 4 courses · typical performance',
  },
  {
    username: 'lucas.almeida',
    name: 'Lucas Almeida',
    role: 'student' as const,
    detail: 'At risk — attendance below the 75% legal minimum',
    flag: true,
  },
  {
    username: 'ana.cavalcante',
    name: 'Ana Cavalcante',
    role: 'teacher' as const,
    detail: 'Teaches OOP and Computer Networks',
  },
]

const ROLE_TAG = {
  student: { label: 'STUDENT', className: 'bg-mbrand-light text-mbrand-dark' },
  teacher: { label: 'TEACHER', className: 'bg-teal-light text-teal-dark' },
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  async function doLogin(u: string, p: string, key: string) {
    setLoading(key)
    setError(null)
    try {
      const res = await api<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: u, password: p }),
      })
      setToken(res.accessToken)
      router.push('/moodle/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(null)
    }
  }

  return (
    <main className="flex min-h-screen">
      {/* Brand panel */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-mbrand-dark p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(60rem 60rem at 20% 10%, #2a78d6 0%, transparent 50%), radial-gradient(50rem 50rem at 90% 90%, #1baf7a 0%, transparent 45%)',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-2xl font-black text-mbrand">
              m
            </span>
            <span className="text-2xl font-bold">moodle-next</span>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            The same domain.<br />A brand-new platform.
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Incremental modernisation of Moodle through domain contract extraction —
            no big-bang rewrite, no service interruption.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              Read contract: consolidated grades and feedback report
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              Write contract: attendance tracking (75% legal minimum)
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              Next.js + PostgreSQL, plugin architecture preserved
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-white/50">
          Academic demo — research-platforms-evolution
        </p>
      </aside>

      {/* Form panel */}
      <section className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <span className="text-2xl font-bold">
              moodle<span className="text-mbrand">-next</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-ink-3">Pick a demo account or type the credentials.</p>

          <div className="mt-6 space-y-3">
            {DEMO_USERS.map((u) => {
              const tag = ROLE_TAG[u.role]
              const initials = u.name.split(' ').map((p) => p[0]).join('')
              return (
                <button
                  key={u.username}
                  onClick={() => doLogin(u.username, 'Moodle@2025', u.username)}
                  disabled={loading !== null}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-black/10 bg-surface-1 p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-mbrand/40 hover:shadow-cardHover disabled:opacity-60"
                >
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      u.role === 'teacher'
                        ? 'bg-teal-light text-teal-dark'
                        : 'bg-mbrand-light text-mbrand-dark'
                    }`}
                  >
                    {initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold">{u.name}</span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider ${tag.className}`}>
                        {tag.label}
                      </span>
                      {u.flag && (
                        <span className="rounded-md bg-danger-light px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-status-critical">
                          AT RISK
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-3">{u.detail}</span>
                  </span>
                  <span className="text-mbrand transition-transform group-hover:translate-x-0.5">
                    {loading === u.username ? '…' : '→'}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-ink-3">
            <span className="h-px flex-1 bg-black/10" /> or <span className="h-px flex-1 bg-black/10" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              doLogin(username, password, 'manual')
            }}
          >
            <label className="mb-1 block text-sm font-medium">Username</label>
            <input
              className="mb-4 w-full rounded-xl border border-black/10 bg-surface-1 px-3.5 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-mbrand/40"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              className="mb-4 w-full rounded-xl border border-black/10 bg-surface-1 px-3.5 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-mbrand/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && <p className="mb-4 text-sm text-status-critical">{error}</p>}
            <button
              type="submit"
              disabled={loading !== null}
              className="w-full rounded-xl bg-mbrand py-2.5 font-semibold text-white transition-colors hover:bg-mbrand-dark disabled:opacity-60"
            >
              {loading === 'manual' ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
