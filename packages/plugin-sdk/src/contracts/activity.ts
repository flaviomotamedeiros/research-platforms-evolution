import type { EnrollmentRef, EventListener, Migration, PluginMetadata, Route, UserRef, CourseRef, PluginStorage } from '../types/common.js'

/** Renderable content returned by an activity plugin for display by the core. */
export interface ActivityContent {
  kind: 'html' | 'json'
  html?: string
  data?: Record<string, unknown>
}

export interface ActivityContentContext {
  activityId: string
  /** Storage scoped to this plugin (see PluginStorage). */
  storage: PluginStorage
}

export interface CompletionCriteria {
  /** Machine-readable key, e.g. "submitted" or "passed" */
  key: string
  /** Human-readable description shown to the student */
  label: string
}

export interface GradingStrategy {
  /** e.g. "points", "rubric", "pass_fail" */
  type: string
  /** Maximum possible grade value */
  maxGrade: number
}

export interface SubmissionContext {
  activityId: string
  enrollment: EnrollmentRef
  attemptNumber: number
}

export interface CompletionCheckContext {
  activityId: string
  enrollmentId: string
}

/**
 * Contract for Activity plugins (e.g. Forum, Quiz, Assignment).
 * An Activity is an interactive learning component within a Course Section.
 */
export interface ActivityPlugin {
  metadata: PluginMetadata

  /** API routes contributed by this plugin, prefixed by the core with /api/plugins/{id} */
  getRoutes(): Route[]

  /** Event listeners this plugin registers on startup */
  getEventListeners(): EventListener[]

  /** Database migrations managed by this plugin */
  getMigrations(): Migration[]

  /**
   * Grading strategy used by this activity.
   * Return null if the activity is not gradable.
   */
  getGradingStrategy(): GradingStrategy | null

  /**
   * Criteria that must all be satisfied for the activity to be marked complete.
   * The core evaluates these after every Submission or Attempt.
   */
  getCompletionCriteria(): CompletionCriteria[]

  /**
   * Checks whether all completion criteria are satisfied for a given enrollment.
   * Called by the core after every relevant event.
   */
  checkCompletion(ctx: CompletionCheckContext): Promise<boolean>

  /**
   * Returns the renderable content of an activity instance (e.g. a Page's HTML).
   * The plugin reads it from its own scoped storage. Return null if the activity
   * type has no displayable content.
   */
  getContent?(ctx: ActivityContentContext): Promise<ActivityContent | null>

  /** Called when a Student is enrolled in a Course containing this Activity. */
  onEnroll?(enrollment: EnrollmentRef, course: CourseRef): Promise<void>

  /** Called when a Student is unenrolled from a Course containing this Activity. */
  onUnenroll?(enrollment: EnrollmentRef, course: CourseRef): Promise<void>
}
