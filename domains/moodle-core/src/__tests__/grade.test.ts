import { describe, it, expect } from 'vitest'
import { Grade } from '../grading/grade.js'

describe('Grade', () => {
  const make = () =>
    Grade.create('grade-1', {
      enrollmentId: 'enr-1',
      activityId: 'act-1',
      value: null,
      maxValue: 100,
      gradingStrategyType: 'points',
    })

  it('starts with null value', () => {
    const grade = make()
    expect(grade.value).toBeNull()
    expect(grade.percentage).toBeNull()
  })

  it('assigns a valid grade and emits GradeUpdated', () => {
    const grade = make()
    grade.pullEvents()
    const result = grade.assign(80)
    expect(result.ok).toBe(true)
    expect(grade.value).toBe(80)
    expect(grade.percentage).toBe(80)
    expect(grade.pullEvents()[0].eventName).toBe('grade.updated')
  })

  it('rejects a grade that exceeds the maximum', () => {
    const grade = make()
    const result = grade.assign(110)
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toBe('EXCEEDS_MAX')
  })

  it('rejects a negative grade', () => {
    const grade = make()
    const result = grade.assign(-1)
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toBe('NEGATIVE_VALUE')
  })

  it('allows manual override and emits GradeOverridden', () => {
    const grade = make()
    grade.assign(70)
    grade.pullEvents()
    const result = grade.override(95, 'Regrade after appeal')
    expect(result.ok).toBe(true)
    expect(grade.value).toBe(95)
    const events = grade.pullEvents()
    expect(events[0].eventName).toBe('grade.overridden')
  })
})
