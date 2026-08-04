import { Entity } from '@rpe/domain-kit'

export interface SectionProps {
  title: string
  order: number
  visible: boolean
}

export class Section extends Entity {
  constructor(
    id: string,
    private props: SectionProps,
  ) {
    super(id)
  }

  get title(): string { return this.props.title }
  get order(): number { return this.props.order }
  get visible(): boolean { return this.props.visible }

  reorder(newOrder: number): void {
    this.props.order = newOrder
  }

  toggleVisibility(): void {
    this.props.visible = !this.props.visible
  }
}
