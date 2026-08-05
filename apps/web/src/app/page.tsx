import Link from 'next/link'

const PLATFORMS = [
  {
    href: '/moodle',
    tag: 'LMS',
    glyph: 'm',
    glyphClass: 'bg-mbrand',
    name: 'moodle-next',
    domain: 'Learning management',
    desc: 'Courses, lesson content, attendance and grades — modernising Moodle.',
    contracts: ['report/myfeedback (read)', 'mod/attendance (write)', 'content plugins'],
    ready: true,
  },
  {
    href: '/glpi',
    tag: 'ITSM',
    glyph: 'g',
    glyphClass: 'bg-gbrand',
    name: 'glpi-next',
    domain: 'IT service management',
    desc: 'Tickets, SLAs and asset inventory — modernising GLPI.',
    contracts: ['report/servicedesk (read)', 'ticket follow-up (write)', 'asset-type plugins'],
    ready: true,
  },
  {
    href: '#',
    tag: 'PM',
    glyph: 'r',
    glyphClass: 'bg-ink-3',
    name: 'redmine-next',
    domain: 'Project management',
    desc: 'Projects, issues and time tracking — modernising Redmine.',
    contracts: ['Coming soon'],
    ready: false,
  },
]

export default function Landing() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#101a3a] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(50rem 50rem at 15% 0%, #2a78d6 0%, transparent 55%), radial-gradient(45rem 45rem at 95% 100%, #3d5afe 0%, transparent 50%), radial-gradient(40rem 40rem at 60% 50%, #1baf7a 0%, transparent 45%)',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 py-20">
          <p className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
            Academic research demo
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Modernising legacy platforms<br />by extracting their domain contracts.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            Public institutions depend on open-source systems they cannot switch off and cannot
            afford to rewrite. This work rebuilds each platform on a shared, modern stack —
            preserving its plugin architecture — without a big-bang migration.
          </p>
        </div>
      </section>

      {/* Platform selection */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="mb-1 text-lg font-bold">Choose a platform</h2>
        <p className="mb-6 text-sm text-ink-3">Each is an independent bounded context on the same platform kit.</p>
        <div className="grid gap-5 md:grid-cols-3">
          {PLATFORMS.map((p) => {
            const inner = (
              <div className={`group flex h-full flex-col rounded-2xl border border-black/5 bg-surface-1 p-6 shadow-card transition-all ${p.ready ? 'hover:-translate-y-1 hover:shadow-cardHover' : 'opacity-70'}`}>
                <div className="mb-4 flex items-center gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-black text-white ${p.glyphClass}`}>
                    {p.glyph}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ink-3">{p.tag}</p>
                    <p className="text-base font-bold">{p.name}</p>
                  </div>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{p.domain}</p>
                <p className="mt-1 text-sm text-ink-2">{p.desc}</p>
                <ul className="mt-4 space-y-1.5">
                  {p.contracts.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-xs text-ink-3">
                      <span className="h-1 w-1 rounded-full bg-ink-3" />{c}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between pt-2">
                  {p.ready ? (
                    <span className="text-sm font-semibold text-ink-1 group-hover:underline">Open platform →</span>
                  ) : (
                    <span className="rounded-full bg-surface-0 px-2.5 py-1 text-xs font-medium text-ink-3">Coming soon</span>
                  )}
                </div>
              </div>
            )
            return p.ready ? (
              <Link key={p.name} href={p.href}>{inner}</Link>
            ) : (
              <div key={p.name}>{inner}</div>
            )
          })}
        </div>
      </section>

      {/* Research note (growable) */}
      <section className="border-t border-black/5 bg-surface-1">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-lg font-bold">About this research</h2>
          <div className="mt-4 grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold">The problem</p>
              <p className="mt-1 text-sm text-ink-2">
                Legacy platforms in the public sector cannot be switched off, and big-bang rewrites
                have a long history of failure. Deferring modernisation only compounds technical debt.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">The approach</p>
              <p className="mt-1 text-sm text-ink-2">
                We target the extension layer, extracting <em>write contracts</em> (plugins that
                change state) and <em>read contracts</em> (plugins that aggregate) as
                platform-agnostic specifications.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">The demos</p>
              <p className="mt-1 text-sm text-ink-2">
                Each platform above is a working reimplementation on Next.js + PostgreSQL, sharing one
                platform kit while keeping its own domain and database.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-8 text-xs text-ink-3">
        research-platforms-evolution — academic demo.
      </footer>
    </main>
  )
}
