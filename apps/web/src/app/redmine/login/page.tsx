'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, setToken } from '@/lib/redmine/client/api'

const DEMO_USERS = [
  { username: 'bruno.dev', name: 'Bruno Dias', role: 'developer' as const, detail: 'Developer — most assigned issues' },
  { username: 'manager', name: 'Project Manager', role: 'manager' as const, detail: 'Roadmap, workload and reporting' },
  { username: 'lia.report', name: 'Lia Prado', role: 'reporter' as const, detail: 'Reporter — opens issues, read-only' },
]

const ROLE_TAG = {
  developer: { className: 'bg-rbrand-light text-rbrand-dark', label: 'DEVELOPER' },
  manager:   { className: 'bg-[#fff4e0] text-[#8a5a00]', label: 'MANAGER' },
  reporter:  { className: 'bg-teal-light text-teal-dark', label: 'REPORTER' },
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  async function doLogin(u: string, p: string, key: string) {
    setLoading(key); setError(null)
    try {
      const res = await api<{ accessToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) })
      setToken(res.accessToken)
      router.push('/redmine/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed'); setLoading(null)
    }
  }

  return (
    <main className="flex min-h-screen">
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-rbrand-dark p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: 'radial-gradient(60rem 60rem at 20% 10%, #b0413e 0%, transparent 50%), radial-gradient(50rem 50rem at 90% 90%, #eb6834 0%, transparent 45%)' }} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-2xl font-black text-rbrand">r</span>
            <span className="text-2xl font-bold">redmine-next</span>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">The same tracker.<br />A brand-new platform.</h1>
          <p className="mt-4 text-lg text-white/80">
            Incremental modernisation of Redmine through domain contract extraction —
            no big-bang rewrite, no service interruption.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white/70" />Read contract: project report with effort &amp; workload</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white/70" />Write contract: issue updates, notes and time logging</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white/70" />Issue trackers as plugins — Bug, Feature, Support</li>
          </ul>
        </div>
        <p className="relative text-xs text-white/50">Academic demo — research-platforms-evolution</p>
      </aside>

      <section className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><span className="text-2xl font-bold">redmine<span className="text-rbrand">-next</span></span></div>
          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-ink-3">Pick a demo account or type the credentials.</p>
          <div className="mt-6 space-y-3">
            {DEMO_USERS.map((u) => {
              const tag = ROLE_TAG[u.role]
              const initials = u.name.split(' ').map((p) => p[0]).join('')
              return (
                <button key={u.username} onClick={() => doLogin(u.username, 'Redmine@2025', u.username)} disabled={loading !== null}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-black/10 bg-surface-1 p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-rbrand/40 hover:shadow-cardHover disabled:opacity-60">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${tag.className}`}>{initials}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold">{u.name}</span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider ${tag.className}`}>{tag.label}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-3">{u.detail}</span>
                  </span>
                  <span className="text-rbrand transition-transform group-hover:translate-x-0.5">{loading === u.username ? '…' : '→'}</span>
                </button>
              )
            })}
          </div>
          <div className="my-6 flex items-center gap-3 text-xs text-ink-3"><span className="h-px flex-1 bg-black/10" /> or <span className="h-px flex-1 bg-black/10" /></div>
          <form onSubmit={(e) => { e.preventDefault(); doLogin(username, password, 'manual') }}>
            <label className="mb-1 block text-sm font-medium">Username</label>
            <input className="mb-4 w-full rounded-xl border border-black/10 bg-surface-1 px-3.5 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-rbrand/40" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input type="password" className="mb-4 w-full rounded-xl border border-black/10 bg-surface-1 px-3.5 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-rbrand/40" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            {error && <p className="mb-4 text-sm text-status-critical">{error}</p>}
            <button type="submit" disabled={loading !== null} className="w-full rounded-xl bg-rbrand py-2.5 font-semibold text-white transition-colors hover:bg-rbrand-dark disabled:opacity-60">
              {loading === 'manual' ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
