import type { Container } from '../container'

/**
 * READ CONTRACT — project report / roadmap (the paper's read-contract case for
 * Redmine). Owns no tables. Aggregates issues, trackers, assignees and time
 * entries into a management view: progress, workload, and estimated vs spent
 * effort. Its query set Q maps directly onto this single service method.
 */

export interface ProjectReport {
  totals: { open: number; closed: number; overdue: number; total: number }
  progress: number // weighted mean doneRatio across issues
  byStatus: Array<{ status: string; count: number }>
  byTracker: Array<{ trackerId: string; label: string; icon: string; colour: string; count: number }>
  byAssignee: Array<{ userId: string; name: string; open: number; closed: number }>
  effort: { estimated: number; spent: number }
}

const STATUSES = ['new', 'in_progress', 'resolved', 'feedback', 'closed']

export async function projectReport(c: Container, projectId?: string): Promise<ProjectReport> {
  const where = projectId ? { projectId } : {}
  const [issues, timeEntries, users] = await Promise.all([
    c.prisma.issue.findMany({ where }),
    c.prisma.timeEntry.findMany({ where }),
    c.prisma.user.findMany({ where: { deletedAt: null } }),
  ])
  const nameOf = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]))

  const isClosed = (s: string) => s === 'closed'
  const now = Date.now()
  const overdue = issues.filter((i) => !isClosed(i.status) && i.dueDate && i.dueDate.getTime() < now)
  const progress =
    issues.length > 0 ? Math.round(issues.reduce((s, i) => s + i.doneRatio, 0) / issues.length) : 0

  const trackers = c.plugins.listTrackers()
  const byTracker = trackers.map((t) => ({
    trackerId: t.metadata.id,
    label: t.displayName,
    icon: t.icon,
    colour: t.colour,
    count: issues.filter((i) => i.trackerPluginId === t.metadata.id).length,
  }))

  const assigneeIds = [...new Set(issues.map((i) => i.assigneeId).filter(Boolean) as string[])]

  return {
    totals: {
      open: issues.filter((i) => !isClosed(i.status)).length,
      closed: issues.filter((i) => isClosed(i.status)).length,
      overdue: overdue.length,
      total: issues.length,
    },
    progress,
    byStatus: STATUSES.map((status) => ({ status, count: issues.filter((i) => i.status === status).length })),
    byTracker,
    byAssignee: assigneeIds
      .map((uid) => ({
        userId: uid,
        name: nameOf.get(uid) ?? uid,
        open: issues.filter((i) => i.assigneeId === uid && !isClosed(i.status)).length,
        closed: issues.filter((i) => i.assigneeId === uid && isClosed(i.status)).length,
      }))
      .sort((a, b) => b.open - a.open),
    effort: {
      estimated: Math.round(issues.reduce((s, i) => s + (i.estimatedHours ?? 0), 0)),
      spent: Math.round(timeEntries.reduce((s, t) => s + t.hours, 0)),
    },
  }
}
