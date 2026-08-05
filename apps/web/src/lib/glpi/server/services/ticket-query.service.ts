import { notFound } from '@rpe/platform-kit'
import type { Container } from '../container'

export interface TicketListItem {
  id: string
  title: string
  status: string
  priority: string
  requester: string
  technician: string | null
  openedAt: string
  dueAt: string
  breaching: boolean
}

function breaching(t: { status: string; dueAt: Date; solvedAt: Date | null }): boolean {
  const resolved = t.status === 'solved' || t.status === 'closed'
  if (resolved) return !!t.solvedAt && t.solvedAt.getTime() > t.dueAt.getTime()
  return t.dueAt.getTime() < Date.now()
}

/** Tickets visible to the caller: technicians/admins see all; requesters see their own. */
export async function listTickets(c: Container, userId: string, role: string): Promise<TicketListItem[]> {
  const where = role === 'requester' ? { requesterId: userId } : {}
  const tickets = await c.prisma.ticket.findMany({ where, orderBy: { openedAt: 'desc' } })
  const userIds = [...new Set(tickets.flatMap((t) => [t.requesterId, t.technicianId].filter(Boolean) as string[]))]
  const users = await c.prisma.user.findMany({ where: { id: { in: userIds } } })
  const nameOf = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]))

  return tickets.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    requester: nameOf.get(t.requesterId) ?? t.requesterId,
    technician: t.technicianId ? nameOf.get(t.technicianId) ?? t.technicianId : null,
    openedAt: t.openedAt.toISOString(),
    dueAt: t.dueAt.toISOString(),
    breaching: breaching(t),
  }))
}

export interface TicketDetail {
  id: string
  title: string
  description: string
  status: string
  priority: string
  requester: string
  technician: string | null
  sla: string
  openedAt: string
  dueAt: string
  solvedAt: string | null
  breaching: boolean
  asset: { id: string; name: string; type: string; icon: string } | null
  followups: Array<{ id: string; author: string; body: string; createdAt: string }>
  canFollowup: boolean
}

export async function ticketDetail(
  c: Container,
  ticketId: string,
  userId: string,
  role: string,
): Promise<TicketDetail> {
  const t = await c.prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!t) throw notFound('Ticket not found')

  const [requester, technician, sla, asset, followups] = await Promise.all([
    c.prisma.user.findUnique({ where: { id: t.requesterId } }),
    t.technicianId ? c.prisma.user.findUnique({ where: { id: t.technicianId } }) : null,
    c.prisma.sla.findUnique({ where: { id: t.slaId } }),
    t.assetId ? c.prisma.asset.findUnique({ where: { id: t.assetId } }) : null,
    c.prisma.ticketFollowup.findMany({ where: { ticketId }, orderBy: { createdAt: 'asc' } }),
  ])

  const authorIds = [...new Set(followups.map((f) => f.authorId))]
  const authors = await c.prisma.user.findMany({ where: { id: { in: authorIds } } })
  const authorName = new Map(authors.map((u) => [u.id, `${u.firstName} ${u.lastName}`]))

  const assetType = asset ? c.plugins.getAssetType(asset.typePluginId) : undefined

  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    requester: requester ? `${requester.firstName} ${requester.lastName}` : t.requesterId,
    technician: technician ? `${technician.firstName} ${technician.lastName}` : null,
    sla: sla?.name ?? t.slaId,
    openedAt: t.openedAt.toISOString(),
    dueAt: t.dueAt.toISOString(),
    solvedAt: t.solvedAt?.toISOString() ?? null,
    breaching: breaching(t),
    asset: asset
      ? {
          id: asset.id,
          name: asset.name,
          type: assetType?.displayName ?? asset.typePluginId,
          icon: assetType?.icon ?? '📦',
        }
      : null,
    followups: followups.map((f) => ({
      id: f.id,
      author: authorName.get(f.authorId) ?? f.authorId,
      body: f.body,
      createdAt: f.createdAt.toISOString(),
    })),
    canFollowup: role === 'technician' || role === 'admin',
  }
}
