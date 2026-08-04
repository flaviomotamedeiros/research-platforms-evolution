import { Entity } from '@rpe/domain-kit'

export interface CategoryProps {
  name: string
  parentId?: string
}

export class Category extends Entity {
  constructor(
    id: string,
    private props: CategoryProps,
  ) {
    super(id)
  }

  get name(): string { return this.props.name }
  get parentId(): string | undefined { return this.props.parentId }
  get isRoot(): boolean { return !this.props.parentId }
}
