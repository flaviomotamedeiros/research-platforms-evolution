import type { EnrollmentRef, PluginMetadata } from '../types/common.js'

export interface GradeItem {
  activityId: string
  activityName: string
  /** Raw score */
  value: number | null
  /** Maximum possible score */
  maxValue: number
  /** Normalized 0–100 percentage */
  percentage: number | null
  /** ISO 8601 timestamp of last grade update */
  gradedAt: string | null
}

export interface AggregationInput {
  enrollment: EnrollmentRef
  items: GradeItem[]
}

export interface AggregationResult {
  /** Final aggregated score, 0–100 */
  finalGrade: number
  /** Human-readable description of the aggregation method */
  method: string
}

/**
 * Contract for Grade Aggregation plugins.
 * The default aggregation (weighted mean) is built into the core.
 * Plugins implement this contract to provide custom aggregation strategies
 * (e.g. "highest grade", "first attempt only", "drop lowest").
 */
export interface GradeAggregationPlugin {
  metadata: PluginMetadata

  /** Human-readable name of this aggregation strategy */
  strategyName: string

  /**
   * Calculates the final grade for an enrollment given all grade items.
   */
  aggregate(input: AggregationInput): Promise<AggregationResult>
}
