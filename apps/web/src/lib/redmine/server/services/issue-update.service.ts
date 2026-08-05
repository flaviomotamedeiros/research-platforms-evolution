import { randomUUID } from 'node:crypto'
import { notFound, unauthorized } from '@rpe/platform-kit'
import { Issue, type IssueStatus } from '@rpe/redmine-core'
import type { Container } from '../container'

/**
 * WRITE CONTRACT — issue update plugin (the paper's write-contract case for
 * Redmine). Owns the issue_journals and time_entries tables, drives status /
 * progress transitions through the Issue aggregate (which guards invariants),
 * and emits its domain events. Reimplementing this contract means recreating
 * the owned tables and the event emissions — nothing of the core beyond them.
 */

function toDomain(r: any): Issue {
  return Issue.reconstitute(r.id, {
    projectId: r.projectId,
    trackerPluginId: r.trackerPluginId,
    subject: r.subject,
    description: r.description,
    status: r.status,
    priority: r.priority,
    authorId: r.authorId,
    assigneeId: r.assigneeId ?? undefined,
    doneRatio: r.doneRatio,
    estimatedHours: r.estimatedHours ?? undefined,
    fields: r.fields,
    createdAt: r.createdAt,
    dueDate: r.dueDate ?? undefined,
    closedAt: r.closedAt ?? undefined,
  })
}

export interface UpdateIssueInput {
  notes: string
  newStatus?: IssueStatus
  doneRatio?: number
  assignToSelf?: boolean
  logHours?: number
}

export async function updateIssue(
  c: Container,
  issueId: string,
  authorId: string,
  input: UpdateIssueInput,
): Promise<{ journalId: string; status: IssueStatus; doneRatio: number }> {
  const row = await c.prisma.issue.findUnique({ where: { id: issueId } })
  if (!row) throw notFound('Issue not found')

  const author = await c.prisma.user.findUnique({ where: { id: authorId } })
  if (!author || author.role === 'reporter') {
    throw unauthorized('Reporters cannot update issues')
  }

  const issue = toDomain(row)
  const details: string[] = []

  if (input.assignToSelf) {
    issue.assignTo(authorId)
    details.push(`assigned to ${author.firstName} ${author.lastName}`)
  }
  if (input.doneRatio != null) {
    const res = issue.setProgress(input.doneRatio)
    if (!res.ok) throw unauthorized(res.error)
    details.push(`progress → ${input.doneRatio}%`)
  }
  if (input.newStatus) {
    const prev = issue.status
    const res = issue.changeStatus(input.newStatus)
    if (!res.ok) throw unauthorized(res.error)
    details.push(`status: ${prev} → ${input.newStatus}`)
  }

  // owned-table writes
  const journalId = randomUUID()
  await c.prisma.issueJournal.create({
    data: {
      id: journalId,
      issueId,
      authorId,
      notes: input.notes,
      detail: details.length ? details.join(' · ') : null,
    },
  })

  if (input.logHours && input.logHours > 0) {
    await c.prisma.timeEntry.create({
      data: {
        id: randomUUID(),
        issueId,
        projectId: issue.projectId,
        userId: authorId,
        hours: input.logHours,
        comment: input.notes.slice(0, 200),
        spentOn: new Date(),
      },
    })
  }

  await c.prisma.issue.update({
    where: { id: issueId },
    data: {
      status: issue.status,
      doneRatio: issue.doneRatio,
      assigneeId: issue.assigneeId ?? null,
      closedAt: issue.closedAt ?? null,
    },
  })

  await c.events.dispatch(issue.pullEvents())
  return { journalId, status: issue.status, doneRatio: issue.doneRatio }
}
