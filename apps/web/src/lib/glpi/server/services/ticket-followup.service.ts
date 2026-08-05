import { randomUUID } from 'node:crypto'
import { notFound, unauthorized } from '@rpe/platform-kit'
import { Ticket, type TicketStatus } from '@rpe/glpi-core'
import type { Container } from '../container'

/**
 * WRITE CONTRACT — ticket follow-up plugin (the paper's write-contract case
 * for GLPI). Owns the ticket_followups table, invokes the core Ticket
 * aggregate to transition status, and emits its domain events. Reimplementing
 * this contract means recreating the owned table and the event emissions —
 * nothing of the host platform core beyond them.
 */

function ticketToDomain(r: any): Ticket {
  return Ticket.reconstitute(r.id, {
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    requesterId: r.requesterId,
    technicianId: r.technicianId ?? undefined,
    assetId: r.assetId ?? undefined,
    slaId: r.slaId,
    entityId: r.entityId,
    openedAt: r.openedAt,
    dueAt: r.dueAt,
    solvedAt: r.solvedAt ?? undefined,
  })
}

export interface AddFollowupInput {
  body: string
  newStatus?: TicketStatus
  assignToSelf?: boolean
}

export async function addFollowup(
  c: Container,
  ticketId: string,
  authorId: string,
  input: AddFollowupInput,
): Promise<{ followupId: string; status: TicketStatus }> {
  const row = await c.prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!row) throw notFound('Ticket not found')

  const author = await c.prisma.user.findUnique({ where: { id: authorId } })
  if (!author || (author.role !== 'technician' && author.role !== 'admin')) {
    throw unauthorized('Only technicians can add follow-ups')
  }

  const ticket = ticketToDomain(row)

  // owned table write
  const followupId = randomUUID()
  await c.prisma.ticketFollowup.create({
    data: { id: followupId, ticketId, authorId, body: input.body },
  })

  // domain transition through the aggregate (guards invariants)
  if (input.assignToSelf) {
    ticket.assignTo(authorId)
  }
  if (input.newStatus) {
    const res = ticket.changeStatus(input.newStatus)
    if (!res.ok) throw unauthorized(res.error)
  }

  await c.prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: ticket.status,
      technicianId: ticket.technicianId ?? null,
      solvedAt: ticket.solvedAt ?? null,
    },
  })

  await c.events.dispatch(ticket.pullEvents())
  return { followupId, status: ticket.status }
}
