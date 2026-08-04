import { describe, it, expect } from 'vitest'
import { Course } from '../course/course.js'

describe('Course', () => {
  const make = (overrides = {}) =>
    Course.create('course-1', {
      fullName: 'Introduction to Programming',
      shortName: 'PROG101',
      categoryId: 'cat-1',
      ...overrides,
    })

  it('creates a course and emits CourseCreated', () => {
    const result = make()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const events = result.value.pullEvents()
    expect(events[0].eventName).toBe('course.created')
  })

  it('fails when full name is empty', () => {
    const result = make({ fullName: '  ' })
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toBe('FULL_NAME_REQUIRED')
  })

  it('fails when short name is empty', () => {
    const result = make({ shortName: '' })
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toBe('SHORT_NAME_REQUIRED')
  })

  it('fails when end date is before start date', () => {
    const result = make({
      startDate: '2026-06-01',
      endDate: '2026-01-01',
    })
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toBe('INVALID_DATE_RANGE')
  })

  it('emits CourseDeleted when deleted', () => {
    const result = make()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    result.value.pullEvents()
    result.value.delete()
    const events = result.value.pullEvents()
    expect(events[0].eventName).toBe('course.deleted')
  })
})
