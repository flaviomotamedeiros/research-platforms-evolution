'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api, setToken } from '@/lib/client/api'

interface Me { name: string; role: string; username: string }

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/grades', label: 'Grades & feedback' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    api<Me>('/me').then(setMe).catch(() => router.push('/login'))
  }, [router])

  function logout() {
    setToken(null)
    router.push('/login')
  }

  const initials = me?.name.split(' ').map((p) => p[0]).slice(0, 2).join('') ?? ''

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-surface-1/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-black text-white">
                m
              </span>
              <span className="text-lg font-bold tracking-tight">
                moodle<span className="text-brand">-next</span>
              </span>
            </Link>
            <nav className="hidden gap-1 sm:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname.startsWith(item.href)
                      ? 'bg-brand-light text-brand-dark'
                      : 'text-ink-2 hover:bg-surface-0 hover:text-ink-1'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {me && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight">{me.name}</p>
                <p className="text-xs capitalize text-ink-3">{me.role}</p>
              </div>
            )}
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand-dark">
              {initials}
            </span>
            <button
              onClick={logout}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-0 hover:text-ink-1"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
