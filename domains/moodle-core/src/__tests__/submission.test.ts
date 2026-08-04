import { describe, it, expect } from 'vitest'
import { Submission } from '../activity/submission.js'

describe('Submission', () => {
  const make = () =>
    Submission.create('sub-1', {
      activityId: 'act-1',
      enrollmentId: 'enr-1',
      attemptNumber: 1,
      content: { text: 'My answer' },
    })

  it('starts in draft status', () => {
    const submission = make()
    expect(submission.status).toBe('draft')
  })

  it('transitions to submitted and records timestamp', () => {
    const submission = make()
    const result = submission.submit()
    expect(result.ok).toBe(true)
    expect(submission.status).toBe('submitted')
    expect(submission.submittedAt).toBeInstanceOf(Date)
  })

  it('cannot be submitted twice', () => {
    const submission = make()
    submission.submit()
    const result = submission.submit()
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toBe('ALREADY_SUBMITTED')
  })

  it('is immutable once grading begins', () => {
    const submission = make()
    submission.submit()
    submission.startGrading()
    const result = submission.submit()
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toBe('ALREADY_BEING_GRADED')
  })
})
