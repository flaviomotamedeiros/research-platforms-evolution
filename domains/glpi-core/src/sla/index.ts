import { Entity } from '@rpe/domain-kit'

export interface SlaProps {
  name: string
  /** Resolution target in hours from ticket open. */
  resolutionHours: number
}

/** Service Level Agreement — a simple value entity referenced by tickets. */
export class Sla extends Entity {
  private constructor(id: string, private props: SlaProps) {
    super(id)
  }

  static reconstitute(id: string, props: SlaProps): Sla {
    return new Sla(id, props)
  }

  get name(): string { return this.props.name }
  get resolutionHours(): number { return this.props.resolutionHours }

  /** Deadline for a ticket opened at `openedAt` under this SLA. */
  deadlineFrom(openedAt: Date): Date {
    return new Date(openedAt.getTime() + this.props.resolutionHours * 3600_000)
  }
}
