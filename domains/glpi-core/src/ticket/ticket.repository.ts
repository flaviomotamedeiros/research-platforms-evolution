import type { Ticket } from './ticket.js'

export interface TicketRepository {
  findById(id: string): Promise<Ticket | null>
  findByTechnician(technicianId: string): Promise<Ticket[]>
  findByRequester(requesterId: string): Promise<Ticket[]>
  save(ticket: Ticket): Promise<void>
}
