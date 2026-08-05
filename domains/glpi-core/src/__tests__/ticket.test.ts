import { describe, it, expect } from 'vitest'
import { Ticket } from '../ticket/ticket.js'

const base = {
  title: 'Printer not working',
  description: 'Paper jam persists',
  priority: 'high' as const,
  requesterId: 'u-req',
  slaId: 'sla-priority',
  entityId: 'ent-it',
  dueAt: new Date(Date.now() + 8 * 3600_000),
}

describe('Ticket', () => {
  it('opens with status new and emits TicketOpened', () => {
    const r = Ticket.open('t1', base)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.status).toBe('new')
    const events = r.value.pullEvents()
    expect(events[0].eventName).toBe('ticket.opened')
  })

  it('rejects an empty title', () => {
    const r = Ticket.open('t2', { ...base, title: '  ' })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toBe('TITLE_REQUIRED')
  })

  it('cannot be solved before assignment', () => {
    const r = Ticket.open('t3', base)
    if (!r.ok) return
    const solve = r.value.changeStatus('solved')
    expect(solve.ok).toBe(false)
    if (solve.ok) return
    expect(solve.error).toBe('CANNOT_SOLVE_UNASSIGNED')
  })

  it('assigns then solves, marking SLA compliance', () => {
    const r = Ticket.open('t4', base)
    if (!r.ok) return
    r.value.assignTo('u-tech')
    r.value.pullEvents()
    const solve = r.value.changeStatus('solved')
    expect(solve.ok).toBe(true)
    expect(r.value.status).toBe('solved')
    expect(r.value.isBreachingSla).toBe(false) // solved before dueAt
    const events = r.value.pullEvents()
    expect(events.some((e) => e.eventName === 'ticket.solved')).toBe(true)
  })

  it('detects SLA breach when solved past the deadline', () => {
    const overdue = { ...base, dueAt: new Date(Date.now() - 3600_000) }
    const r = Ticket.open('t5', overdue)
    if (!r.ok) return
    r.value.assignTo('u-tech')
    r.value.changeStatus('solved')
    expect(r.value.isBreachingSla).toBe(true)
  })
})
