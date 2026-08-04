'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, setToken } from '@/lib/client/api'

const DEMO_USERS = [
  { username: 'pedro.ferreira', label: 'Pedro — aluno', role: 'Aluno em 4 cursos' },
  { username: 'lucas.almeida', label: 'Lucas — aluno em risco', role: 'Frequência abaixo de 75%' },
  { username: 'ana.cavalcante', label: 'Ana — professora', role: 'POO e Redes' },
]

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function doLogin(u: string, p: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await api<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: u, password: p }),
      })
      setToken(res.accessToken)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login')
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen">
      {/* Brand panel */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-dark p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(60rem 60rem at 20% 10%, #2a78d6 0%, transparent 50%), radial-gradient(50rem 50rem at 90% 90%, #1baf7a 0%, transparent 45%)',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-2xl font-black text-brand">
              m
            </span>
            <span className="text-2xl font-bold">moodle-next</span>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            O mesmo domínio.<br />Uma plataforma nova.
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Modernização incremental do Moodle por extração de contratos de domínio —
            sem big-bang, sem interromper o serviço.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              Contratos de leitura: relatório consolidado de notas e feedback
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              Contratos de escrita: controle de frequência (LDB art. 24 VI)
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              Next.js + PostgreSQL, arquitetura de plugins preservada
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-white/50">
          Demo acadêmica — research-platforms-evolution
        </p>
      </aside>

      {/* Form panel */}
      <section className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="text-2xl font-bold">
              moodle<span className="text-brand">-next</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold">Entrar</h2>
          <p className="mt-1 text-sm text-ink-3">Use uma conta da demonstração ou digite as credenciais.</p>

          <div className="mt-6 space-y-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.username}
                onClick={() => doLogin(u.username, 'Moodle@2025')}
                disabled={loading}
                className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-surface-1 px-4 py-3 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover disabled:opacity-60"
              >
                <span>
                  <span className="block text-sm font-semibold">{u.label}</span>
                  <span className="block text-xs text-ink-3">{u.role}</span>
                </span>
                <span className="text-brand">→</span>
              </button>
            ))}
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-ink-3">
            <span className="h-px flex-1 bg-black/10" /> ou <span className="h-px flex-1 bg-black/10" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              doLogin(username, password)
            }}
          >
            <label className="mb-1 block text-sm font-medium">Usuário</label>
            <input
              className="mb-4 w-full rounded-xl border border-black/10 bg-surface-1 px-3.5 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-brand/40"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <label className="mb-1 block text-sm font-medium">Senha</label>
            <input
              type="password"
              className="mb-4 w-full rounded-xl border border-black/10 bg-surface-1 px-3.5 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-brand/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && <p className="mb-4 text-sm text-status-critical">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand py-2.5 font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
