import { PrismaClient } from '../src/generated/redmine-client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const PASSWORD = 'Redmine@2025'
const H = 3600_000
const D = 24 * H

function rng(seed: number) {
  let a = seed >>> 0
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const rand = rng(9182)

const users = {
  admin: { id: 'u-admin', username: 'admin', first: 'System', last: 'Admin', role: 'admin' },
  manager: { id: 'u-manager', username: 'manager', first: 'Project', last: 'Manager', role: 'manager' },
  bruno: { id: 'u-bruno', username: 'bruno.dev', first: 'Bruno', last: 'Dias', role: 'developer' },
  carla: { id: 'u-carla', username: 'carla.dev', first: 'Carla', last: 'Nunes', role: 'developer' },
  diego: { id: 'u-diego', username: 'diego.dev', first: 'Diego', last: 'Alves', role: 'developer' },
  lia: { id: 'u-lia', username: 'lia.report', first: 'Lia', last: 'Prado', role: 'reporter' },
}
const devs = [users.bruno, users.carla, users.diego]

const projects = [
  { id: 'p-portal', name: 'Citizen Portal', identifier: 'PORTAL', description: 'Public-facing services portal — accounts, requests and notifications.', leadId: users.manager.id },
  { id: 'p-mobile', name: 'Mobile App', identifier: 'MOBILE', description: 'Native mobile client for the citizen portal.', leadId: users.manager.id },
  { id: 'p-infra', name: 'Infrastructure', identifier: 'INFRA', description: 'Platform infrastructure, CI/CD and observability.', leadId: users.manager.id },
]

type Tk = 'tracker_bug' | 'tracker_feature' | 'tracker_support'
interface IDef {
  id: string; projectId: string; tracker: Tk; subject: string; description: string
  status: 'new' | 'in_progress' | 'resolved' | 'feedback' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assignee?: string; done: number; est?: number; createdDaysAgo: number; dueInDays?: number
  fields: Record<string, string>
}

const issues: IDef[] = [
  { id: 'i-1', projectId: 'p-portal', tracker: 'tracker_bug', subject: 'Login fails on Safari after token refresh', description: 'Users on Safari are logged out every few minutes. The refreshed token is not persisted to storage.', status: 'in_progress', priority: 'high', assignee: users.bruno.id, done: 40, est: 8, createdDaysAgo: 4, dueInDays: 1, fields: { severity: 'High', reproducibility: 'Always', foundIn: 'v2.3.0' } },
  { id: 'i-2', projectId: 'p-portal', tracker: 'tracker_feature', subject: 'Export requests to CSV', description: 'Staff need to export the filtered request list to CSV for reporting.', status: 'new', priority: 'normal', assignee: users.carla.id, done: 0, est: 5, createdDaysAgo: 2, dueInDays: 10, fields: { businessValue: 'Medium', targetRelease: 'v2.5' } },
  { id: 'i-3', projectId: 'p-portal', tracker: 'tracker_support', subject: 'Citizen cannot reset password', description: 'A citizen reports the reset email never arrives. Investigate mail delivery.', status: 'feedback', priority: 'normal', assignee: users.diego.id, done: 60, est: 3, createdDaysAgo: 6, fields: { channel: 'Email', customer: 'M. Ribeiro' } },
  { id: 'i-4', projectId: 'p-portal', tracker: 'tracker_bug', subject: 'Notification badge count is wrong', description: 'The unread badge shows stale counts until a full reload.', status: 'closed', priority: 'low', assignee: users.bruno.id, done: 100, est: 2, createdDaysAgo: 20, fields: { severity: 'Low', reproducibility: 'Sometimes', foundIn: 'v2.2.1' } },
  { id: 'i-5', projectId: 'p-portal', tracker: 'tracker_feature', subject: 'Two-factor authentication', description: 'Add optional TOTP-based 2FA for citizen accounts.', status: 'in_progress', priority: 'high', assignee: users.carla.id, done: 30, est: 20, createdDaysAgo: 10, dueInDays: 14, fields: { businessValue: 'High', targetRelease: 'v3.0' } },
  { id: 'i-6', projectId: 'p-mobile', tracker: 'tracker_bug', subject: 'App crashes on Android 12 launch', description: 'Cold start crashes on some Android 12 devices due to a null intent extra.', status: 'in_progress', priority: 'urgent', assignee: users.diego.id, done: 70, est: 6, createdDaysAgo: 3, dueInDays: 0, fields: { severity: 'Critical', reproducibility: 'Always', foundIn: 'v1.1.0' } },
  { id: 'i-7', projectId: 'p-mobile', tracker: 'tracker_feature', subject: 'Offline mode for saved requests', description: 'Allow viewing previously loaded requests without connectivity.', status: 'new', priority: 'normal', assignee: users.bruno.id, done: 0, est: 15, createdDaysAgo: 1, dueInDays: 21, fields: { businessValue: 'Medium', targetRelease: 'v1.3' } },
  { id: 'i-8', projectId: 'p-mobile', tracker: 'tracker_bug', subject: 'Push notifications delayed on iOS', description: 'Notifications arrive several minutes late on iOS.', status: 'resolved', priority: 'high', assignee: users.carla.id, done: 100, est: 4, createdDaysAgo: 8, fields: { severity: 'Medium', reproducibility: 'Sometimes', foundIn: 'v1.0.5' } },
  { id: 'i-9', projectId: 'p-infra', tracker: 'tracker_feature', subject: 'Blue-green deployments', description: 'Introduce blue-green deployment to eliminate downtime on releases.', status: 'in_progress', priority: 'high', assignee: users.diego.id, done: 50, est: 24, createdDaysAgo: 12, dueInDays: 7, fields: { businessValue: 'High', targetRelease: 'Q3' } },
  { id: 'i-10', projectId: 'p-infra', tracker: 'tracker_bug', subject: 'Nightly backup job fails intermittently', description: 'The nightly database backup fails ~1 in 5 runs with a timeout.', status: 'new', priority: 'urgent', assignee: users.bruno.id, done: 0, est: 6, createdDaysAgo: 2, dueInDays: 2, fields: { severity: 'High', reproducibility: 'Sometimes', foundIn: 'infra-2.0' } },
  { id: 'i-11', projectId: 'p-infra', tracker: 'tracker_support', subject: 'Grant staging access to new developer', description: 'Onboard the new developer with staging and CI credentials.', status: 'closed', priority: 'low', assignee: users.diego.id, done: 100, est: 1, createdDaysAgo: 15, fields: { channel: 'Internal', customer: 'New hire' } },
  { id: 'i-12', projectId: 'p-infra', tracker: 'tracker_feature', subject: 'Centralised log aggregation', description: 'Ship all service logs to a central, searchable store.', status: 'resolved', priority: 'normal', assignee: users.carla.id, done: 100, est: 12, createdDaysAgo: 25, fields: { businessValue: 'Medium', targetRelease: 'Q2' } },
]

// A few journal notes on active issues
const journals: Record<string, Array<{ author: string; notes: string; detail?: string }>> = {
  'i-1': [{ author: users.bruno.id, notes: 'Reproduced on Safari 17. The token refresh handler writes to sessionStorage but the app reads from localStorage.', detail: 'status: new → in_progress · assigned to Bruno Dias' }],
  'i-6': [{ author: users.diego.id, notes: 'Guarded the null intent extra and added a regression test. Verifying on physical devices before resolving.', detail: 'progress → 70%' }],
  'i-8': [{ author: users.carla.id, notes: 'Root cause was APNs priority set to 5. Raised to 10; latency now under 5 seconds.', detail: 'status: in_progress → resolved · progress → 100%' }],
  'i-9': [{ author: users.diego.id, notes: 'Load balancer target groups configured. Working on the traffic-switch automation.', detail: 'progress → 50%' }],
}

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10)
  const now = Date.now()

  await prisma.timeEntry.deleteMany()
  await prisma.issueJournal.deleteMany()
  await prisma.issue.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  await prisma.user.createMany({
    data: Object.values(users).map((u) => ({
      id: u.id, username: u.username, email: `${u.username}@institute.edu`,
      firstName: u.first, lastName: u.last, role: u.role, passwordHash: hash,
    })),
  })
  await prisma.project.createMany({ data: projects.map((p) => ({ ...p, status: 'active' })) })

  await prisma.issue.createMany({
    data: issues.map((i) => ({
      id: i.id, projectId: i.projectId, trackerPluginId: i.tracker, subject: i.subject,
      description: i.description, status: i.status, priority: i.priority,
      authorId: users.lia.id, assigneeId: i.assignee ?? null, doneRatio: i.done,
      estimatedHours: i.est ?? null, fields: JSON.stringify(i.fields),
      createdAt: new Date(now - i.createdDaysAgo * D),
      dueDate: i.dueInDays != null ? new Date(now + i.dueInDays * D) : null,
      closedAt: i.status === 'closed' ? new Date(now - Math.max(0, i.createdDaysAgo - 3) * D) : null,
    })),
  })

  const journalRows: any[] = []
  const timeRows: any[] = []
  for (const [issueId, entries] of Object.entries(journals)) {
    const iss = issues.find((x) => x.id === issueId)!
    entries.forEach((e, k) => {
      journalRows.push({ id: `j-${issueId}-${k}`, issueId, authorId: e.author, notes: e.notes, detail: e.detail ?? null, createdAt: new Date(now - (iss.createdDaysAgo - 1 - k) * D) })
    })
  }
  // time entries for issues with progress
  for (const i of issues) {
    if (i.done > 0 && i.assignee) {
      const logged = Math.round((i.est ?? 4) * (i.done / 100) * 10) / 10
      if (logged > 0) timeRows.push({ id: `te-${i.id}`, issueId: i.id, projectId: i.projectId, userId: i.assignee, hours: logged, comment: 'Work logged', spentOn: new Date(now - i.createdDaysAgo * D + D) })
    }
  }
  await prisma.issueJournal.createMany({ data: journalRows })
  await prisma.timeEntry.createMany({ data: timeRows })

  console.log(`Redmine seed complete:
  users:      ${Object.keys(users).length}
  projects:   ${projects.length}
  issues:     ${issues.length}
  journals:   ${journalRows.length}
  timeEntries:${timeRows.length}
Password for all users: ${PASSWORD}
  admin · manager · bruno.dev/carla.dev/diego.dev (developers) · lia.report (reporter)`)
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
