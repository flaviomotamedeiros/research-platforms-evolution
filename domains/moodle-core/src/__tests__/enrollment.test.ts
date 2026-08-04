import { describe, it, expect } from 'vitest'
import { Enrollment } from '../enrollment/enrollment.js'

describe('Enrollment', () => {
  const make = (overrides = {}) =>
    Enrollment.create('enr-1', {
      userId: 'user-1',
      courseId: 'course-1',
      role: 'student',
      ...overrides,
    })

  it('creates active enrollment and emits EnrollmentCreated', () => {
    const enrollment = make()
    expect(enrollment.isActive).toBe(true)
    expect(enrollment.role).toBe('student')
    const events = enrollment.pullEvents()
    expect(events[0].eventName).toBe('enrollment.created')
  })

  it('suspends an active enrollment', () => {
    const enrollment = make()
    const result = enrollment.suspend()
    expect(result.ok).toBe(true)
    expect(enrollment.status).toBe('suspended')
    expect(enrollment.pullEvents().some(e => e.eventName === 'enrollment.suspended')).toBe(true)
  })

  it('cannot suspend an already suspended enrollment', () => {
    const enrollment = make()
    enrollment.suspend()
    const result = enrollment.suspend()
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toBe('ALREADY_SUSPENDED')
  })

  it('soft-deletes enrollment and preserves history', () => {
    const enrollment = make()
    const result = enrollment.delete()
    expect(result.ok).toBe(true)
    expect(enrollment.isDeleted).toBe(true)
    expect(enrollment.isActive).toBe(false)
  })

  it('cannot delete an already deleted enrollment', () => {
    const enrollment = make()
    enrollment.delete()
    const result = enrollment.delete()
    expect(result.ok).toBe(false)
  })

  it('changes role and emits EnrollmentRoleChanged', () => {
    const enrollment = make()
    const result = enrollment.changeRole('teacher')
    expect(result.ok).toBe(true)
    expect(enrollment.role).toBe('teacher')
    const events = enrollment.pullEvents()
    const roleChangedEvent = events.find(e => e.eventName === 'enrollment.role_changed')
    expect(roleChangedEvent).toBeDefined()
  })
})
