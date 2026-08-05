import { notFound } from '@rpe/platform-kit'
import type { SpecField } from '@rpe/plugin-sdk'
import type { Container } from '../container'

export interface ProjectListItem {
  id: string
  name: string
  identifier: string
  description: string
  status: string
  openIssues: number
  progress: number
}

export async function listProjects(c: Container): Promise<ProjectListItem[]> {
  const [projects, issues] = await Promise.all([
    c.prisma.project.findMany({ orderBy: { name: 'asc' } }),
    c.prisma.issue.findMany(),
  ])
  return projects.map((p) => {
    const own = issues.filter((i) => i.projectId === p.id)
    const progress = own.length ? Math.round(own.reduce((s, i) => s + i.doneRatio, 0) / own.length) : 0
    return {
      id: p.id,
      name: p.name,
      identifier: p.identifier,
      description: p.description,
      status: p.status,
      openIssues: own.filter((i) => i.status !== 'closed').length,
      progress,
    }
  })
}

function trackerMeta(c: Container, id: string) {
  const t = c.plugins.getTracker(id)
  return t
    ? { id: t.metadata.id, label: t.displayName, icon: t.icon, colour: t.colour }
    : { id, label: id, icon: '📋', colour: '#868c99' }
}

export interface IssueListItem {
  id: string
  subject: string
  status: string
  priority: string
  doneRatio: number
  assignee: string | null
  tracker: { id: string; label: string; icon: string; colour: string }
  overdue: boolean
}

export async function listIssues(c: Container, projectId: string): Promise<IssueListItem[]> {
  const issues = await c.prisma.issue.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } })
  const users = await c.prisma.user.findMany({
    where: { id: { in: issues.map((i) => i.assigneeId).filter(Boolean) as string[] } },
  })
  const nameOf = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]))
  const now = Date.now()
  return issues.map((i) => ({
    id: i.id,
    subject: i.subject,
    status: i.status,
    priority: i.priority,
    doneRatio: i.doneRatio,
    assignee: i.assigneeId ? nameOf.get(i.assigneeId) ?? null : null,
    tracker: trackerMeta(c, i.trackerPluginId),
    overdue: !!i.dueDate && i.status !== 'closed' && i.dueDate.getTime() < now,
  }))
}

export interface IssueDetail {
  id: string
  projectId: string
  projectName: string
  subject: string
  description: string
  status: string
  priority: string
  doneRatio: number
  author: string
  assignee: string | null
  estimatedHours: number | null
  spentHours: number
  createdAt: string
  dueDate: string | null
  overdue: boolean
  tracker: { id: string; label: string; icon: string; colour: string }
  fields: SpecField[]
  journals: Array<{ id: string; author: string; notes: string; detail: string | null; createdAt: string }>
  canUpdate: boolean
}

export async function issueDetail(
  c: Container,
  issueId: string,
  role: string,
): Promise<IssueDetail> {
  const i = await c.prisma.issue.findUnique({ where: { id: issueId } })
  if (!i) throw notFound('Issue not found')

  const [project, author, assignee, journals, time] = await Promise.all([
    c.prisma.project.findUnique({ where: { id: i.projectId } }),
    c.prisma.user.findUnique({ where: { id: i.authorId } }),
    i.assigneeId ? c.prisma.user.findUnique({ where: { id: i.assigneeId } }) : null,
    c.prisma.issueJournal.findMany({ where: { issueId }, orderBy: { createdAt: 'asc' } }),
    c.prisma.timeEntry.findMany({ where: { issueId } }),
  ])
  const authorIds = [...new Set(journals.map((j) => j.authorId))]
  const jAuthors = await c.prisma.user.findMany({ where: { id: { in: authorIds } } })
  const jName = new Map(jAuthors.map((u) => [u.id, `${u.firstName} ${u.lastName}`]))

  const tracker = c.plugins.getTracker(i.trackerPluginId)

  return {
    id: i.id,
    projectId: i.projectId,
    projectName: project?.name ?? i.projectId,
    subject: i.subject,
    description: i.description,
    status: i.status,
    priority: i.priority,
    doneRatio: i.doneRatio,
    author: author ? `${author.firstName} ${author.lastName}` : i.authorId,
    assignee: assignee ? `${assignee.firstName} ${assignee.lastName}` : null,
    estimatedHours: i.estimatedHours ?? null,
    spentHours: Math.round(time.reduce((s, t) => s + t.hours, 0) * 10) / 10,
    createdAt: i.createdAt.toISOString(),
    dueDate: i.dueDate?.toISOString() ?? null,
    overdue: !!i.dueDate && i.status !== 'closed' && i.dueDate.getTime() < Date.now(),
    tracker: trackerMeta(c, i.trackerPluginId),
    fields: tracker ? tracker.describe(i.fields) : [],
    journals: journals.map((j) => ({
      id: j.id,
      author: jName.get(j.authorId) ?? j.authorId,
      notes: j.notes,
      detail: j.detail,
      createdAt: j.createdAt.toISOString(),
    })),
    canUpdate: role !== 'reporter',
  }
}

export async function listMyIssues(c: Container, userId: string): Promise<Array<IssueListItem & { projectName: string }>> {
  const issues = await c.prisma.issue.findMany({ where: { assigneeId: userId }, orderBy: { createdAt: 'desc' } })
  const projects = await c.prisma.project.findMany({ where: { id: { in: [...new Set(issues.map((i) => i.projectId))] } } })
  const pName = new Map(projects.map((p) => [p.id, p.name]))
  const now = Date.now()
  return issues.map((i) => ({
    id: i.id,
    subject: i.subject,
    status: i.status,
    priority: i.priority,
    doneRatio: i.doneRatio,
    assignee: null,
    tracker: trackerMeta(c, i.trackerPluginId),
    overdue: !!i.dueDate && i.status !== 'closed' && i.dueDate.getTime() < now,
    projectName: pName.get(i.projectId) ?? i.projectId,
  }))
}
