import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const PASSWORD = 'Glpi@2025'

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(7731)
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
const H = 3600_000

// ── Entities ────────────────────────────────────────────────────────────────
const entities = [
  { id: 'ent-it', name: 'IT Department' },
  { id: 'ent-admin', name: 'Administration' },
  { id: 'ent-academic', name: 'Academic Affairs' },
]

// ── Users ───────────────────────────────────────────────────────────────────
const technicians = [
  { id: 'u-sofia', username: 'sofia.tech', first: 'Sofia', last: 'Andrade' },
  { id: 'u-diego', username: 'diego.tech', first: 'Diego', last: 'Martins' },
  { id: 'u-paula', username: 'paula.tech', first: 'Paula', last: 'Rezende' },
]
const requesters = [
  { id: 'u-carlos', username: 'carlos.user', first: 'Carlos', last: 'Nunes', entityId: 'ent-admin' },
  { id: 'u-ana', username: 'ana.user', first: 'Ana', last: 'Barros', entityId: 'ent-academic' },
  { id: 'u-marcos', username: 'marcos.user', first: 'Marcos', last: 'Lima', entityId: 'ent-academic' },
  { id: 'u-julia', username: 'julia.user', first: 'Júlia', last: 'Costa', entityId: 'ent-admin' },
  { id: 'u-rafael', username: 'rafael.user', first: 'Rafael', last: 'Souza', entityId: 'ent-it' },
]

// ── SLAs ────────────────────────────────────────────────────────────────────
const slas = [
  { id: 'sla-critical', name: 'Critical (4h)', resolutionHours: 4 },
  { id: 'sla-priority', name: 'Priority (8h)', resolutionHours: 8 },
  { id: 'sla-standard', name: 'Standard (24h)', resolutionHours: 24 },
]
const SLA_FOR: Record<string, string> = {
  critical: 'sla-critical', high: 'sla-priority', medium: 'sla-standard', low: 'sla-standard',
}

// ── Assets ──────────────────────────────────────────────────────────────────
const assets = [
  { id: 'as-pc1', name: 'DELL-OPTIPLEX-01', typePluginId: 'asset_computer', status: 'in_use', serial: 'DL7X21A', entityId: 'ent-admin', assignedTo: 'u-carlos',
    spec: { cpu: 'Intel i5-12500', ram: '16 GB', storage: '512 GB SSD', os: 'Windows 11 Pro' } },
  { id: 'as-pc2', name: 'LENOVO-THINKPAD-07', typePluginId: 'asset_computer', status: 'in_use', serial: 'LN9K44B', entityId: 'ent-academic', assignedTo: 'u-ana',
    spec: { cpu: 'AMD Ryzen 7', ram: '32 GB', storage: '1 TB SSD', os: 'Ubuntu 24.04' } },
  { id: 'as-pc3', name: 'DELL-LATITUDE-14', typePluginId: 'asset_computer', status: 'repair', serial: 'DL3M77C', entityId: 'ent-academic', assignedTo: 'u-marcos',
    spec: { cpu: 'Intel i7-1165G7', ram: '16 GB', storage: '256 GB SSD', os: 'Windows 11 Pro' } },
  { id: 'as-pc4', name: 'HP-ELITEDESK-22', typePluginId: 'asset_computer', status: 'spare', serial: 'HP1B09D', entityId: 'ent-it', assignedTo: null,
    spec: { cpu: 'Intel i5-11400', ram: '8 GB', storage: '256 GB SSD', os: 'Windows 10 Pro' } },
  { id: 'as-net1', name: 'CISCO-SW-CORE-01', typePluginId: 'asset_network', status: 'in_use', serial: 'CS8842E', entityId: 'ent-it', assignedTo: null,
    spec: { ports: '48× 1GbE', mgmtIp: '10.0.0.2', firmware: 'IOS 15.2' } },
  { id: 'as-net2', name: 'UBIQUITI-AP-3F', typePluginId: 'asset_network', status: 'in_use', serial: 'UB2231F', entityId: 'ent-academic', assignedTo: null,
    spec: { ports: '1× 2.5GbE PoE', mgmtIp: '10.0.3.14', firmware: 'UniFi 7.5' } },
  { id: 'as-net3', name: 'MIKROTIK-RTR-EDGE', typePluginId: 'asset_network', status: 'in_use', serial: 'MK5567G', entityId: 'ent-it', assignedTo: null,
    spec: { ports: '10× 1GbE + SFP+', mgmtIp: '10.0.0.1', firmware: 'RouterOS 7.14' } },
  { id: 'as-prn1', name: 'HP-LASERJET-M428', typePluginId: 'asset_printer', status: 'in_use', serial: 'HP7788H', entityId: 'ent-admin', assignedTo: null,
    spec: { technology: 'Laser', colour: 'Monochrome', monthlyDuty: '4,000 pages' } },
  { id: 'as-prn2', name: 'EPSON-ECOTANK-L6270', typePluginId: 'asset_printer', status: 'repair', serial: 'EP3390I', entityId: 'ent-academic', assignedTo: null,
    spec: { technology: 'Inkjet', colour: 'Colour', monthlyDuty: '2,500 pages' } },
]

// ── Tickets ─────────────────────────────────────────────────────────────────
interface TDef {
  id: string; title: string; description: string; priority: 'low' | 'medium' | 'high' | 'critical'
  requesterId: string; technicianId: string | null; assetId: string | null
  status: 'new' | 'assigned' | 'pending' | 'solved' | 'closed'
  openedHoursAgo: number; solvedAfterHours?: number
}
const tickets: TDef[] = [
  { id: 'tk-1', title: 'Cannot connect to Wi-Fi in Room 3F', description: 'Since this morning the wireless network in the third-floor lab drops every few minutes. Several students are affected.', priority: 'high', requesterId: 'u-ana', technicianId: 'u-sofia', assetId: 'as-net2', status: 'assigned', openedHoursAgo: 5 },
  { id: 'tk-2', title: 'Laptop will not boot after update', description: 'My Latitude shows a blue screen right after the last Windows update. I have an important class tomorrow.', priority: 'critical', requesterId: 'u-marcos', technicianId: 'u-diego', assetId: 'as-pc3', status: 'pending', openedHoursAgo: 10 },
  { id: 'tk-3', title: 'Printer jams on every job', description: 'The colour printer in Academic Affairs jams on the first page every time. Toner looks fine.', priority: 'medium', requesterId: 'u-ana', technicianId: 'u-paula', assetId: 'as-prn2', status: 'assigned', openedHoursAgo: 30 },
  { id: 'tk-4', title: 'Request: install statistics software', description: 'Please install R and RStudio on my workstation for the coming semester.', priority: 'low', requesterId: 'u-carlos', technicianId: 'u-sofia', assetId: 'as-pc1', status: 'solved', openedHoursAgo: 40, solvedAfterHours: 6 },
  { id: 'tk-5', title: 'Email quota exceeded', description: 'I can no longer send emails — the system says my mailbox is full.', priority: 'medium', requesterId: 'u-julia', technicianId: 'u-diego', assetId: null, status: 'solved', openedHoursAgo: 50, solvedAfterHours: 3 },
  { id: 'tk-6', title: 'Network switch port down', description: 'Ports 20–24 on the core switch appear to be dead. Several offices offline.', priority: 'critical', requesterId: 'u-rafael', technicianId: 'u-sofia', assetId: 'as-net1', status: 'solved', openedHoursAgo: 20, solvedAfterHours: 7 },
  { id: 'tk-7', title: 'New employee workstation setup', description: 'Please prepare a spare desktop for the new administrative assistant starting Monday.', priority: 'low', requesterId: 'u-julia', technicianId: 'u-paula', assetId: 'as-pc4', status: 'pending', openedHoursAgo: 15 },
  { id: 'tk-8', title: 'VPN keeps disconnecting', description: 'When working from home the VPN drops every 10 minutes. Started last week.', priority: 'high', requesterId: 'u-carlos', technicianId: null, assetId: null, status: 'new', openedHoursAgo: 3 },
  { id: 'tk-9', title: 'Projector not detected in Auditorium', description: 'The HDMI projector in the main auditorium is not detected by any laptop.', priority: 'medium', requesterId: 'u-marcos', technicianId: null, assetId: null, status: 'new', openedHoursAgo: 2 },
  { id: 'tk-10', title: 'Shared drive access denied', description: 'I lost access to the department shared drive after the migration.', priority: 'medium', requesterId: 'u-ana', technicianId: 'u-diego', assetId: null, status: 'closed', openedHoursAgo: 80, solvedAfterHours: 12 },
  { id: 'tk-11', title: 'Slow computer performance', description: 'My ThinkPad has become very slow over the past month, especially when opening the browser.', priority: 'low', requesterId: 'u-ana', technicianId: 'u-paula', assetId: 'as-pc2', status: 'pending', openedHoursAgo: 26 },
  { id: 'tk-12', title: 'Password reset for lab account', description: 'A student forgot the shared lab account password. Please reset it.', priority: 'low', requesterId: 'u-rafael', technicianId: 'u-sofia', assetId: null, status: 'solved', openedHoursAgo: 12, solvedAfterHours: 1 },
]

// Follow-ups per ticket (authored by the assigned technician)
const followups: Record<string, string[]> = {
  'tk-1': ['Confirmed the access point is rebooting under load. Investigating a firmware bug on the 3F AP.'],
  'tk-2': ['Booted into safe mode and rolled back the update. Running diagnostics before returning the laptop — will keep pending until confirmed stable.'],
  'tk-4': ['R 4.4 and RStudio installed and tested. Closing as resolved.'],
  'tk-5': ['Increased mailbox quota to 5 GB and archived old items. Please confirm you can send again.'],
  'tk-6': ['Replaced the faulty line card on the core switch. Ports 20–24 back online and verified.'],
  'tk-10': ['Re-granted permissions on the department group after the migration. Confirmed access with the requester.'],
  'tk-12': ['Reset the lab account password and shared it securely with the requester.'],
}

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10)
  const now = Date.now()

  await prisma.ticketFollowup.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.sla.deleteMany()
  await prisma.user.deleteMany()
  await prisma.entity.deleteMany()

  await prisma.entity.createMany({ data: entities })
  await prisma.sla.createMany({ data: slas })

  await prisma.user.createMany({
    data: [
      { id: 'u-admin', username: 'admin', email: 'admin@institute.edu', firstName: 'IT', lastName: 'Manager', role: 'admin', entityId: 'ent-it', passwordHash: hash },
      ...technicians.map((t) => ({ id: t.id, username: t.username, email: `${t.username}@institute.edu`, firstName: t.first, lastName: t.last, role: 'technician', entityId: 'ent-it', passwordHash: hash })),
      ...requesters.map((u) => ({ id: u.id, username: u.username, email: `${u.username}@institute.edu`, firstName: u.first, lastName: u.last, role: 'requester', entityId: u.entityId, passwordHash: hash })),
    ],
  })

  await prisma.asset.createMany({
    data: assets.map((a) => ({
      id: a.id, name: a.name, typePluginId: a.typePluginId, status: a.status,
      serialNumber: a.serial, entityId: a.entityId, assignedToUserId: a.assignedTo,
      spec: JSON.stringify(a.spec),
    })),
  })

  const requesterEntity = new Map([...requesters, { id: 'u-rafael', entityId: 'ent-it' }].map((u) => [u.id, u.entityId]))
  await prisma.ticket.createMany({
    data: tickets.map((t) => {
      const openedAt = new Date(now - t.openedHoursAgo * H)
      const slaId = SLA_FOR[t.priority]
      const hours = slas.find((s) => s.id === slaId)!.resolutionHours
      const dueAt = new Date(openedAt.getTime() + hours * H)
      const solvedAt = t.solvedAfterHours != null ? new Date(openedAt.getTime() + t.solvedAfterHours * H) : null
      return {
        id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority,
        requesterId: t.requesterId, technicianId: t.technicianId, assetId: t.assetId,
        slaId, entityId: requesterEntity.get(t.requesterId) ?? 'ent-it',
        openedAt, dueAt, solvedAt,
      }
    }),
  })

  const followupRows: any[] = []
  for (const [ticketId, bodies] of Object.entries(followups)) {
    const t = tickets.find((x) => x.id === ticketId)!
    bodies.forEach((body, i) => {
      followupRows.push({
        id: `fu-${ticketId}-${i}`, ticketId, authorId: t.technicianId ?? 'u-sofia',
        body, createdAt: new Date(now - (t.openedHoursAgo - 1 - i) * H),
      })
    })
  }
  await prisma.ticketFollowup.createMany({ data: followupRows })

  console.log(`GLPI seed complete:
  entities:    ${entities.length}
  users:       ${1 + technicians.length + requesters.length}
  slas:        ${slas.length}
  assets:      ${assets.length}
  tickets:     ${tickets.length}
  followups:   ${followupRows.length}
Password for all users: ${PASSWORD}
  admin · sofia.tech/diego.tech/paula.tech (technicians) · carlos.user/ana.user/… (requesters)`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
