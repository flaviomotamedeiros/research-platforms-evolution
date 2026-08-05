import type { Container } from '../container'

/**
 * READ CONTRACT — service-desk report (the paper's read-contract case for
 * GLPI). Owns no tables. Aggregates tickets, technicians, and SLAs into a
 * management view: workload by status and priority, per-technician load, and
 * SLA compliance. In the modernised stack the contract's query set Q maps
 * directly onto this single service method.
 */

export interface ServiceDeskReport {
  totals: { open: number; solved: number; breaching: number; total: number }
  byStatus: Array<{ status: string; count: number }>
  byPriority: Array<{ priority: string; count: number }>
  byTechnician: Array<{ technicianId: string; name: string; open: number; solved: number }>
  sla: { met: number; breached: number; complianceRate: number }
}

const STATUSES = ['new', 'assigned', 'pending', 'solved', 'closed']
const PRIORITIES = ['critical', 'high', 'medium', 'low']

export async function serviceDeskReport(c: Container): Promise<ServiceDeskReport> {
  const [tickets, technicians] = await Promise.all([
    c.prisma.ticket.findMany(),
    c.prisma.user.findMany({ where: { role: 'technician', deletedAt: null } }),
  ])
  const nameOf = new Map(technicians.map((t) => [t.id, `${t.firstName} ${t.lastName}`]))

  const isOpen = (s: string) => s !== 'solved' && s !== 'closed'
  const isResolved = (s: string) => s === 'solved' || s === 'closed'
  const now = Date.now()
  const breaching = tickets.filter(
    (t) =>
      (isOpen(t.status) && t.dueAt.getTime() < now) ||
      (isResolved(t.status) && t.solvedAt && t.solvedAt.getTime() > t.dueAt.getTime()),
  )

  const resolved = tickets.filter((t) => isResolved(t.status) && t.solvedAt)
  const breachedResolved = resolved.filter((t) => t.solvedAt!.getTime() > t.dueAt.getTime())
  const met = resolved.length - breachedResolved.length
  const complianceRate = resolved.length > 0 ? Math.round((met / resolved.length) * 100) : 100

  return {
    totals: {
      open: tickets.filter((t) => isOpen(t.status)).length,
      solved: resolved.length,
      breaching: breaching.length,
      total: tickets.length,
    },
    byStatus: STATUSES.map((status) => ({
      status,
      count: tickets.filter((t) => t.status === status).length,
    })),
    byPriority: PRIORITIES.map((priority) => ({
      priority,
      count: tickets.filter((t) => t.priority === priority).length,
    })),
    byTechnician: technicians
      .map((t) => ({
        technicianId: t.id,
        name: nameOf.get(t.id) ?? t.id,
        open: tickets.filter((x) => x.technicianId === t.id && isOpen(x.status)).length,
        solved: tickets.filter((x) => x.technicianId === t.id && isResolved(x.status)).length,
      }))
      .sort((a, b) => b.open - a.open),
    sla: { met, breached: breachedResolved.length, complianceRate },
  }
}
