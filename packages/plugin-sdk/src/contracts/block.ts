import type { CourseRef, EnrollmentRef, PluginMetadata, UserRef } from '../types/common.js'

export interface BlockContext {
  user: UserRef
  course?: CourseRef
  enrollment?: EnrollmentRef
  /** Current page path, e.g. "/courses/123/section/2" */
  pagePath: string
}

export interface BlockContent {
  /** Block title shown in the header */
  title: string
  /**
   * React component name exported by the plugin's frontend bundle.
   * The core loads this component into the Plugin Slot.
   */
  component: string
  /** Props serialized as JSON and passed to the component */
  props: Record<string, unknown>
}

/**
 * Contract for Block plugins — UI widgets rendered in designated Plugin Slots.
 * Examples: "Upcoming Deadlines", "Recent Activity", "Course Progress".
 */
export interface BlockPlugin {
  metadata: PluginMetadata

  /**
   * Returns the content to render for a given context.
   * Return null to hide the block in this context.
   */
  render(ctx: BlockContext): Promise<BlockContent | null>

  /**
   * The Plugin Slots where this block can appear.
   * e.g. ["course.sidebar", "dashboard.main"]
   */
  slots: string[]
}
