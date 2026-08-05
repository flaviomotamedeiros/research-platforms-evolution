import { describe, it, expect } from 'vitest'
import { Issue } from '../issue/index.js'

const base = {
  projectId: 'p1',
  trackerPluginId: 'tracker_bug',
  subject: 'Login fails on Safari',
  description: 'Token not stored',
  priority: 'high' as const,
  authorId: 'u-a',
  assigneeId: 'u-b',
  fields: '{}',
}

describe('Issue', () => {
  it('opens with status new and 0% progress', () => {
    const r = Issue.open('i1', base)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.status).toBe('new')
    expect(r.value.doneRatio).toBe(0)
    expect(r.value.pullEvents()[0].eventName).toBe('issue.opened')
  })

  it('rejects an empty subject', () => {
    const r = Issue.open('i2', { ...base, subject: ' ' })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toBe('SUBJECT_REQUIRED')
  })

  it('rejects an invalid progress ratio', () => {
    const r = Issue.open('i3', base)
    if (!r.ok) return
    expect(r.value.setProgress(150).ok).toBe(false)
    expect(r.value.setProgress(60).ok).toBe(true)
    expect(r.value.doneRatio).toBe(60)
  })

  it('closing sets progress to 100 and closedAt', () => {
    const r = Issue.open('i4', base)
    if (!r.ok) return
    r.value.changeStatus('closed')
    expect(r.value.status).toBe('closed')
    expect(r.value.doneRatio).toBe(100)
    expect(r.value.closedAt).toBeDefined()
  })

  it('cannot change status once closed', () => {
    const r = Issue.open('i5', base)
    if (!r.ok) return
    r.value.changeStatus('closed')
    const again = r.value.changeStatus('in_progress')
    expect(again.ok).toBe(false)
    if (again.ok) return
    expect(again.error).toBe('ALREADY_CLOSED')
  })
})
