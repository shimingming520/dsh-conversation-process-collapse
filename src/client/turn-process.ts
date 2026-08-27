import type { AssistantBlock, ChatConversationViewNode } from '@deepseek-ai/dsh-client-runtime/client'
import type {
  AssistantSurface, ChatFlowPartitioner, ChatFlowRow, ChatNode, ChatProcessMember,
} from '@deepseek-ai/dsh-client-ui-conversation/client'

/** Node kinds that are always their turn's process noise rather than results. */
const PROCESS_KINDS: ReadonlySet<string> = new Set(['tool-call', 'model-retry', 'workflow-run'])

/** Whether these blocks carry durable result content (text/images/other). */
function hasResultContent(blocks: readonly AssistantBlock[]): boolean {
  return blocks.some((block) => {
    if (block.kind === 'text') return block.text.trim() !== ''
    return block.kind === 'image' || block.kind === 'other'
  })
}

/** Whether these blocks carry a non-blank reasoning block worth splitting out. */
function hasReasoning(blocks: readonly AssistantBlock[]): boolean {
  return blocks.some(block => block.kind === 'reasoning' && block.text.trim() !== '')
}

function nodeRow(key: string, surface: AssistantSurface): ChatFlowRow {
  return { kind: 'node', key, surface }
}

interface TurnPlan {
  readonly closed: boolean
  readonly keys: string[]
  /** Last content-bearing assistant-step key of the turn, when one exists. */
  resultKey: string | undefined
  durationMs: number | null
}

interface ProcessGroup {
  readonly splitKey: string | undefined
  readonly durationMs: number | null
  readonly rows: readonly ChatProcessMember[]
}

/**
 * Partition the ordered Chat flow into standalone rows and per-turn process
 * groups. A turn groups only while it is CLOSED and has a content-bearing
 * assistant-step (otherwise grouping would hide the turn's only answer):
 * its non-result rows fold into one collapsible group at the first member's
 * position, and the result step splits there when it also carries reasoning.
 * Open and unknown-status turns keep today's ungrouped flow so live
 * streaming never moves rows.
 * @param order - visible Chat Node keys in flow order.
 * @param node - store read for one key.
 * @returns render rows in flow order.
 */
export function partitionChatFlow(
  order: readonly string[],
  node: (key: string) => ChatConversationViewNode | undefined,
): ChatFlowRow[] {
  const byTurn = new Map<number, TurnPlan>()
  for (const key of order) {
    const value = node(key)
    if (value === undefined) continue
    const location = value.location
    if (location.kind !== 'turn' && location.kind !== 'step') continue
    const turn = location.turn.turn
    const current = byTurn.get(turn) ?? {
      closed: location.turn.status === 'closed',
      keys: [],
      resultKey: undefined,
      durationMs: null,
    }
    current.keys.push(key)
    if (value.kind === 'assistant-step' && hasResultContent((value as ChatNode<'assistant-step'>).data.blocks)) {
      current.resultKey = key
    }
    const { start, end } = location.turn
    if (start !== undefined && end !== undefined) current.durationMs = end.time - start.time
    byTurn.set(turn, current)
  }

  const groups = new Map<number, ProcessGroup>()
  for (const [turn, plan] of byTurn) {
    if (!plan.closed || plan.resultKey === undefined) continue
    const rows: ChatProcessMember[] = []
    let splitKey: string | undefined
    for (const key of plan.keys) {
      const value = node(key)
      if (value === undefined) continue
      if (value.kind === 'assistant-step') {
        if (key === plan.resultKey) {
          if (hasReasoning((value as ChatNode<'assistant-step'>).data.blocks)) {
            rows.push({ key, surface: 'process' })
            splitKey = key
          }
          continue
        }
        rows.push({ key, surface: 'full' })
        continue
      }
      if (PROCESS_KINDS.has(value.kind)) rows.push({ key, surface: 'full' })
    }
    if (rows.length === 0) continue
    groups.set(turn, { splitKey, durationMs: plan.durationMs, rows })
  }

  const rows: ChatFlowRow[] = []
  const emitted = new Set<number>()
  for (const key of order) {
    const value = node(key)
    const turn = value === undefined ? undefined : turnOf(value)
    if (turn !== undefined) {
      const group = groups.get(turn)
      if (group !== undefined) {
        // The split closing step is a group member (its reasoning face) AND
        // owns a standalone content face: the content row wins its own
        // position, the group carries the reasoning face.
        if (key === group.splitKey) {
          rows.push(nodeRow(key, 'content'))
          continue
        }
        if (group.rows.some(row => row.key === key)) {
          if (emitted.has(turn)) continue
          emitted.add(turn)
          rows.push({ kind: 'process-group', turn, durationMs: group.durationMs, rows: group.rows })
          continue
        }
      }
    }
    rows.push(nodeRow(key, 'full'))
  }
  return rows
}

function turnOf(value: ChatConversationViewNode): number | undefined {
  const location = value.location
  return location.kind === 'turn' || location.kind === 'step' ? location.turn.turn : undefined
}

/** The chat view's optional service face: the partitioner is the whole plugin. */
export const chatFlowPartitioner: ChatFlowPartitioner = {
  partition: partitionChatFlow,
}
