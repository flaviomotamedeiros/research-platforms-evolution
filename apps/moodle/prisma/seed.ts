import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const PASSWORD = 'Moodle@2025'

// ── Deterministic RNG (mulberry32) — same dataset on every run ──────────────
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20261)
const gauss = () => {
  // Box-Muller
  const u = Math.max(rand(), 1e-9)
  const v = Math.max(rand(), 1e-9)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// ── People ──────────────────────────────────────────────────────────────────
type Profile = 'excellent' | 'regular' | 'atrisk' | 'critical'
const PROFILE_GRADE: Record<Profile, [number, number]> = {
  excellent: [88, 7], regular: [74, 10], atrisk: [58, 12], critical: [42, 14],
}
const PROFILE_PRESENCE: Record<Profile, number> = {
  excellent: 0.96, regular: 0.85, atrisk: 0.74, critical: 0.55,
}

const teachers = [
  { id: 'u-ana',    username: 'ana.cavalcante', first: 'Ana',    last: 'Cavalcante' },
  { id: 'u-helio',  username: 'helio.torres',   first: 'Hélio',  last: 'Torres' },
  { id: 'u-renata', username: 'renata.costa',   first: 'Renata', last: 'Costa' },
]

const students: Array<{ id: string; username: string; first: string; last: string; profile: Profile }> = [
  { id: 's-pedro',    username: 'pedro.ferreira',  first: 'Pedro',    last: 'Ferreira',   profile: 'regular' },
  { id: 's-maria',    username: 'maria.santos',    first: 'Maria',    last: 'Santos',     profile: 'excellent' },
  { id: 's-lucas',    username: 'lucas.almeida',   first: 'Lucas',    last: 'Almeida',    profile: 'critical' },
  { id: 's-aline',    username: 'aline.ribeiro',   first: 'Aline',    last: 'Ribeiro',    profile: 'excellent' },
  { id: 's-bruno',    username: 'bruno.carvalho',  first: 'Bruno',    last: 'Carvalho',   profile: 'regular' },
  { id: 's-carla',    username: 'carla.pereira',   first: 'Carla',    last: 'Pereira',    profile: 'regular' },
  { id: 's-daniel',   username: 'daniel.araujo',   first: 'Daniel',   last: 'Araújo',     profile: 'atrisk' },
  { id: 's-elisa',    username: 'elisa.moreira',   first: 'Elisa',    last: 'Moreira',    profile: 'excellent' },
  { id: 's-felipe',   username: 'felipe.cunha',    first: 'Felipe',   last: 'Cunha',      profile: 'regular' },
  { id: 's-gabriela', username: 'gabriela.melo',   first: 'Gabriela', last: 'Melo',       profile: 'regular' },
  { id: 's-henrique', username: 'henrique.batista',first: 'Henrique', last: 'Batista',    profile: 'atrisk' },
  { id: 's-isabela',  username: 'isabela.correia', first: 'Isabela',  last: 'Correia',    profile: 'excellent' },
  { id: 's-jonas',    username: 'jonas.freitas',   first: 'Jonas',    last: 'Freitas',    profile: 'regular' },
  { id: 's-karina',   username: 'karina.dias',     first: 'Karina',   last: 'Dias',       profile: 'regular' },
  { id: 's-marina',   username: 'marina.rocha',    first: 'Marina',   last: 'Rocha',      profile: 'atrisk' },
  { id: 's-natan',    username: 'natan.aguiar',    first: 'Natan',    last: 'Aguiar',     profile: 'critical' },
]
const profileOf = new Map(students.map((s) => [s.id, s.profile]))

// ── Courses, activities, session topics ─────────────────────────────────────
interface CourseDef {
  id: string; shortName: string; fullName: string; teacherId: string
  activities: Array<{ name: string; plugin: string; max: number; graded: boolean }>
  topics: string[]
  days: number[] // weekdays (1=Mon..5=Fri)
}

const courses: CourseDef[] = [
  {
    id: 'c-poo', shortName: 'TEC-POO', fullName: 'Programação Orientada a Objetos', teacherId: 'u-ana',
    activities: [
      { name: 'Trabalho 1 — Classes e Encapsulamento', plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Quiz — Herança e Polimorfismo',          plugin: 'mod_quiz',   max: 100, graded: true },
      { name: 'Projeto — Sistema de Biblioteca',        plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Trabalho 2 — Interfaces e Coleções',     plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Projeto Final — API REST em Java',       plugin: 'mod_assign', max: 100, graded: false },
    ],
    topics: [
      'Apresentação do curso e ambiente Java', 'Classes, atributos e métodos', 'Construtores e encapsulamento',
      'Herança e sobrescrita', 'Polimorfismo e classes abstratas', 'Interfaces', 'Coleções: List e Map',
      'Tratamento de exceções', 'Streams e lambdas', 'JDBC e persistência', 'Padrões de projeto: Factory',
      'Padrões de projeto: Observer', 'APIs REST com Spring', 'Testes com JUnit', 'Revisão do projeto final',
      'Apresentações de projeto — parte 1', 'Apresentações de projeto — parte 2', 'Revisão para a prova',
      'Prova bimestral', 'Devolutiva e encerramento',
    ],
    days: [1, 3],
  },
  {
    id: 'c-bd', shortName: 'TEC-BD', fullName: 'Banco de Dados Relacional', teacherId: 'u-helio',
    activities: [
      { name: 'Lista 1 — Modelo Entidade-Relacionamento', plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Trabalho — Normalização até 3FN',          plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Quiz — SQL: consultas e junções',          plugin: 'mod_quiz',   max: 100, graded: true },
      { name: 'Projeto — Modelagem do sistema acadêmico', plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Lista 2 — Procedures e triggers',          plugin: 'mod_assign', max: 100, graded: false },
    ],
    topics: [
      'Apresentação e SGBDs', 'Modelo ER: entidades e atributos', 'Relacionamentos e cardinalidade',
      'Modelo relacional', 'Álgebra relacional', 'SQL: DDL', 'SQL: consultas básicas', 'JOINs',
      'Agregações e agrupamento', 'Subconsultas', 'Normalização: 1FN e 2FN', '3FN e BCNF',
      'Índices e desempenho', 'Transações e ACID', 'Procedures e functions', 'Triggers',
      'Backup e recuperação', 'Projeto: entrega parcial', 'Revisão geral', 'Prova prática',
    ],
    days: [2, 4],
  },
  {
    id: 'c-redes', shortName: 'TEC-RD', fullName: 'Redes de Computadores', teacherId: 'u-ana',
    activities: [
      { name: 'Trabalho 1 — Modelo OSI vs TCP/IP',   plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Lab — Sub-redes e CIDR',              plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Quiz — Protocolos de transporte',     plugin: 'mod_quiz',   max: 100, graded: true },
      { name: 'Projeto — Rede de um laboratório',    plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Lab — Configuração de VLANs',         plugin: 'mod_assign', max: 100, graded: false },
    ],
    topics: [
      'Apresentação e história das redes', 'Modelo OSI', 'Modelo TCP/IP', 'Endereçamento IPv4',
      'Sub-redes e CIDR', 'IPv6', 'HTTP, DNS e DHCP', 'TCP e UDP', 'Cabeamento estruturado',
      'Switches e roteadores', 'VLANs', 'Roteamento estático', 'Roteamento dinâmico', 'Wi-Fi',
      'Segurança: firewall e ACLs', 'VPN', 'Monitoramento com SNMP', 'Projeto: apresentações',
      'Revisão', 'Avaliação final',
    ],
    days: [1, 5],
  },
  {
    id: 'c-web', shortName: 'TEC-WEB', fullName: 'Desenvolvimento Web', teacherId: 'u-renata',
    activities: [
      { name: 'Trabalho — Página com HTML e CSS',      plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Quiz — JavaScript: DOM e eventos',      plugin: 'mod_quiz',   max: 100, graded: true },
      { name: 'Projeto — SPA com React',               plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Trabalho — Formulários e validação',    plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Projeto Final — Aplicação full-stack',  plugin: 'mod_assign', max: 100, graded: false },
    ],
    topics: [
      'Apresentação e ferramentas', 'HTML semântico', 'CSS: box model', 'Flexbox e Grid',
      'Responsividade', 'JavaScript: fundamentos', 'DOM e eventos', 'Fetch e APIs', 'ES6+',
      'React: componentes', 'React: estado e props', 'React: hooks', 'Roteamento', 'Formulários',
      'Autenticação no front', 'Deploy', 'Acessibilidade', 'Projeto: apresentações', 'Revisão', 'Avaliação',
    ],
    days: [2, 3],
  },
  {
    id: 'c-so', shortName: 'TEC-SO', fullName: 'Sistemas Operacionais', teacherId: 'u-helio',
    activities: [
      { name: 'Lista — Processos e threads',        plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Quiz — Escalonamento',               plugin: 'mod_quiz',   max: 100, graded: true },
      { name: 'Lab — Shell script',                 plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Trabalho — Gerência de memória',     plugin: 'mod_assign', max: 100, graded: false },
    ],
    topics: [
      'Apresentação e histórico', 'Estrutura do SO', 'Processos', 'Threads', 'Escalonamento',
      'Sincronização', 'Deadlocks', 'Gerência de memória', 'Memória virtual', 'Sistemas de arquivos',
      'Entrada e saída', 'Virtualização', 'Contêineres', 'Shell e automação', 'Segurança',
      'Estudo de caso: Linux', 'Revisão', 'Avaliação',
    ],
    days: [4, 5],
  },
]

// Enrolment map: pedro in 4 courses; others distributed
const enrolmentPlan: Record<string, string[]> = {
  'c-poo':   ['s-pedro', 's-maria', 's-lucas', 's-aline', 's-bruno', 's-carla', 's-daniel', 's-elisa', 's-felipe', 's-gabriela', 's-henrique', 's-isabela'],
  'c-bd':    ['s-pedro', 's-maria', 's-lucas', 's-bruno', 's-carla', 's-elisa', 's-felipe', 's-jonas', 's-karina', 's-marina', 's-natan', 's-isabela'],
  'c-redes': ['s-pedro', 's-maria', 's-aline', 's-daniel', 's-gabriela', 's-henrique', 's-jonas', 's-karina', 's-marina', 's-natan'],
  'c-web':   ['s-pedro', 's-lucas', 's-aline', 's-bruno', 's-elisa', 's-gabriela', 's-isabela', 's-jonas', 's-marina', 's-felipe'],
  'c-so':    ['s-maria', 's-carla', 's-daniel', 's-henrique', 's-karina', 's-natan', 's-lucas', 's-bruno'],
}

// Feedback pools by grade band
const FB = {
  high: [
    'Excelente trabalho. Domínio completo do conteúdo, solução clara e bem estruturada.',
    'Muito bom! Todos os critérios atendidos com qualidade acima do esperado.',
    'Ótima organização e justificativas técnicas precisas. Continue assim.',
    'Trabalho exemplar — usei trechos como referência em aula.',
  ],
  mid: [
    'Bom trabalho, mas atente-se aos casos de borda apontados nos comentários.',
    'Conteúdo correto no geral; a seção final ficou superficial. Revise os conceitos da unidade 3.',
    'Boa solução, com pequenos deslizes de nomenclatura. Veja as anotações no arquivo.',
    'Atendeu aos requisitos, mas a documentação pode melhorar bastante.',
  ],
  low: [
    'Entrega incompleta. Refaça as questões 2 e 4 e reenvie na recuperação.',
    'Há erros conceituais importantes. Procure a monitoria antes da próxima entrega.',
    'O trabalho não atende aos critérios mínimos. Vamos conversar no horário de atendimento.',
    'Faltou desenvolvimento na maior parte dos itens. Reveja o material da unidade.',
  ],
}
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]

// ── Semester calendar: Mar 2 – Jun 26, 2026, skipping holidays ──────────────
const HOLIDAYS = new Set(['2026-04-03', '2026-04-21', '2026-05-01', '2026-06-04'])
function sessionDates(days: number[], count: number): Date[] {
  const out: Date[] = []
  const d = new Date(2026, 2, 2) // Mar 2, 2026 (Mon)
  while (out.length < count && d < new Date(2026, 5, 27)) {
    const iso = d.toISOString().slice(0, 10)
    if (days.includes(d.getDay()) && !HOLIDAYS.has(iso)) out.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10)

  // Wipe in dependency order (idempotent full reseed)
  await prisma.attendanceLog.deleteMany()
  await prisma.attendanceSession.deleteMany()
  await prisma.grade.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.user.deleteMany()
  await prisma.course.deleteMany()
  await prisma.category.deleteMany()

  await prisma.category.create({ data: { id: 'cat-ti', name: 'Informática e Computação', idnumber: 'TI' } })

  await prisma.course.createMany({
    data: courses.map((c) => ({
      id: c.id, fullName: c.fullName, shortName: c.shortName, categoryId: 'cat-ti', visible: true,
    })),
  })

  await prisma.user.createMany({
    data: [
      { id: 'u-admin', username: 'admin', email: 'admin@ifal.edu.br', firstName: 'Admin', lastName: 'Sistema', role: 'admin', passwordHash: hash },
      ...teachers.map((t) => ({
        id: t.id, username: t.username, email: `${t.username}@ifal.edu.br`,
        firstName: t.first, lastName: t.last, role: 'teacher', passwordHash: hash,
      })),
      ...students.map((s) => ({
        id: s.id, username: s.username, email: `${s.username}@ifal.edu.br`,
        firstName: s.first, lastName: s.last, role: 'student', passwordHash: hash,
      })),
    ],
  })

  // Enrolments
  const enrolments: Array<{ id: string; userId: string; courseId: string; role: string }> = []
  for (const c of courses) {
    enrolments.push({ id: `e-${c.teacherId}-${c.id}`, userId: c.teacherId, courseId: c.id, role: 'teacher' })
    for (const sid of enrolmentPlan[c.id]) {
      enrolments.push({ id: `e-${sid}-${c.id}`, userId: sid, courseId: c.id, role: 'student' })
    }
  }
  await prisma.enrollment.createMany({
    data: enrolments.map((e) => ({ ...e, status: 'active', enrolledAt: new Date(2026, 1, 10) })),
  })

  // Activities + grades
  const activityRows: any[] = []
  const gradeRows: any[] = []
  for (const c of courses) {
    c.activities.forEach((a, i) => {
      const actId = `a-${c.id}-${i}`
      activityRows.push({
        id: actId, courseId: c.id, sectionId: `sec-${i + 1}`, pluginId: a.plugin, name: a.name, visible: true,
      })
      if (!a.graded) return
      for (const sid of enrolmentPlan[c.id]) {
        const [mean, sd] = PROFILE_GRADE[profileOf.get(sid)!]
        // ~8% of graded activities still pending per student
        if (rand() < 0.08) continue
        const value = Math.round(clamp(mean + gauss() * sd, 0, a.max) * 10) / 10
        const band = value >= 80 ? 'high' : value >= 60 ? 'mid' : 'low'
        gradeRows.push({
          id: `g-${sid}-${actId}`, enrollmentId: `e-${sid}-${c.id}`, activityId: actId,
          value, maxValue: a.max, feedback: pick(FB[band]), gradingStrategyType: 'points',
        })
      }
    })
  }
  await prisma.activity.createMany({ data: activityRows })
  await prisma.grade.createMany({ data: gradeRows })

  // Attendance: full semester per course
  const sessionRows: any[] = []
  const logRows: any[] = []
  const today = new Date(2026, 5, 10) // "current" date in the demo
  for (const c of courses) {
    const dates = sessionDates(c.days, c.topics.length)
    dates.forEach((date, i) => {
      const sessId = `ss-${c.id}-${i}`
      sessionRows.push({ id: sessId, courseId: c.id, date, description: c.topics[i] ?? `Aula ${i + 1}` })
      if (date >= today) return // future sessions have no logs
      for (const sid of enrolmentPlan[c.id]) {
        const p = PROFILE_PRESENCE[profileOf.get(sid)!]
        const r = rand()
        // critical students: absence streak mid-semester
        const streak = profileOf.get(sid) === 'critical' && i >= 8 && i <= 12
        const status = streak ? 'absent'
          : r < p ? 'present'
          : r < p + 0.05 ? 'late'
          : r < p + 0.09 ? 'excused'
          : 'absent'
        logRows.push({ id: `lg-${sessId}-${sid}`, sessionId: sessId, userId: sid, status })
      }
    })
  }
  await prisma.attendanceSession.createMany({ data: sessionRows })
  // createMany in chunks (Neon over the wire)
  for (let i = 0; i < logRows.length; i += 500) {
    await prisma.attendanceLog.createMany({ data: logRows.slice(i, i + 500) })
  }

  console.log(`Seed complete:
  courses:     ${courses.length}
  users:       ${1 + teachers.length + students.length}
  enrolments:  ${enrolments.length}
  activities:  ${activityRows.length}
  grades:      ${gradeRows.length}
  sessions:    ${sessionRows.length}
  logs:        ${logRows.length}
Password for all users: ${PASSWORD}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
