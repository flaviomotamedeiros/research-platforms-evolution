import { AggregateRoot } from '@rpe/domain-kit'
import { BaseDomainEvent } from '@rpe/domain-kit'
import { fail, ok, type Result } from '@rpe/domain-kit'
import type { Section } from './section.js'

export class CourseCreated extends BaseDomainEvent {
  constructor(readonly courseId: string, readonly categoryId: string) {
    super('course.created', courseId)
  }
}

export class CourseDeleted extends BaseDomainEvent {
  constructor(readonly courseId: string) {
    super('course.deleted', courseId)
  }
}

export class SectionReordered extends BaseDomainEvent {
  constructor(readonly courseId: string, readonly sectionId: string, readonly newOrder: number) {
    super('course.section_reordered', courseId)
  }
}

export interface CourseProps {
  fullName: string
  shortName: string
  categoryId: string
  /** ISO 8601 date string */
  startDate?: string
  endDate?: string
  visible: boolean
  sections: Section[]
}

export type CourseError =
  | 'SHORT_NAME_REQUIRED'
  | 'FULL_NAME_REQUIRED'
  | 'INVALID_DATE_RANGE'
  | 'SECTION_NOT_FOUND'

export class Course extends AggregateRoot {
  private constructor(
    id: string,
    private props: CourseProps,
  ) {
    super(id)
  }

  static create(
    id: string,
    props: Omit<CourseProps, 'sections' | 'visible'>,
  ): Result<Course, CourseError> {
    if (!props.fullName.trim()) return fail('FULL_NAME_REQUIRED')
    if (!props.shortName.trim()) return fail('SHORT_NAME_REQUIRED')
    if (props.startDate && props.endDate && props.startDate >= props.endDate) {
      return fail('INVALID_DATE_RANGE')
    }

    const course = new Course(id, { ...props, visible: true, sections: [] })
    course.emit(new CourseCreated(id, props.categoryId))
    return ok(course)
  }

  static reconstitute(id: string, props: CourseProps): Course {
    return new Course(id, props)
  }

  get fullName(): string { return this.props.fullName }
  get shortName(): string { return this.props.shortName }
  get categoryId(): string { return this.props.categoryId }
  get visible(): boolean { return this.props.visible }
  get sections(): readonly Section[] { return this.props.sections }

  reorderSection(sectionId: string, newOrder: number): Result<void, CourseError> {
    const section = this.props.sections.find(s => s.id === sectionId)
    if (!section) return fail('SECTION_NOT_FOUND')
    section.reorder(newOrder)
    this.emit(new SectionReordered(this.id, sectionId, newOrder))
    return ok(undefined)
  }

  delete(): void {
    this.emit(new CourseDeleted(this.id))
  }
}
