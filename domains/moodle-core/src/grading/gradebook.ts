import { Entity } from '@rpe/domain-kit'
import type { Grade } from './grade.js'

export type AggregationMethod =
  | 'mean'
  | 'weighted_mean'
  | 'highest'
  | 'lowest'
  | 'natural'

export interface GradebookProps {
  courseId: string
  aggregationMethod: AggregationMethod
  grades: Grade[]
}

export class Gradebook extends Entity {
  constructor(
    id: string,
    private props: GradebookProps,
  ) {
    super(id)
  }

  get courseId(): string { return this.props.courseId }
  get aggregationMethod(): AggregationMethod { return this.props.aggregationMethod }
  get grades(): readonly Grade[] { return this.props.grades }

  gradesFor(enrollmentId: string): Grade[] {
    return this.props.grades.filter(g => g.enrollmentId === enrollmentId)
  }

  /**
   * Calculates the final grade for an enrollment using the configured method.
   * Returns null if no grades have been assigned yet.
   */
  calculateFinalGrade(enrollmentId: string): number | null {
    const grades = this.gradesFor(enrollmentId).filter(g => g.value !== null)
    if (grades.length === 0) return null

    const percentages = grades.map(g => g.percentage!)

    switch (this.props.aggregationMethod) {
      case 'mean':
      case 'weighted_mean':
      case 'natural':
        return percentages.reduce((sum, p) => sum + p, 0) / percentages.length
      case 'highest':
        return Math.max(...percentages)
      case 'lowest':
        return Math.min(...percentages)
    }
  }
}
