// Pure flow-partition behavior: which turns group, what joins the group,
// how a closing step splits, and how generated images are promoted to the
// visible result — no render machinery.

import { describe, expect, it } from 'vitest'
import type {
  AssistantBlock, ChatConversationViewNode, ConversationLocation, TurnLocation,
} from '@deepseek-ai/dsh-client-runtime/client'
import { partitionChatFlow } from '../src/client/turn-process.ts'

const noData: TurnLocation['data'] = { get: () => undefined } as never

function turnLocation(turn: number, status: TurnLocation['status'], start?: number, end?: number): TurnLocation {
  return {
    turn,
    start: start === undefined ? undefined : { type: 'turn/start', seq: turn * 10, time: start, turn } as never,
    end: end === undefined ? undefined : { type: 'turn/end', seq: turn * 10 + 1, time: end, turn, reason: 'completed' } as never,
    status,
    steps: [],
    data: noData,
  }
}

function location(turnLocation: TurnLocation, step?: number): ConversationLocation {
  return step === undefined
    ? { kind: 'turn', turn: turnLocation }
    : {
      kind: 'step',
      turn: turnLocation,
      step: {
        turn: turnLocation.turn,
        step,
        start: undefined,
        end: undefined,
        status: 'closed' as const,
        data: noData,
      },
    }
}

function node(
  key: string,
  kind: string,
  loc: ConversationLocation,
  data: unknown = null,
  anchorSeq = 1,
): ChatConversationViewNode {
  return { key, kind, id: key, target: 'chat', anchorSeq, location: loc, visibility: 'visible', data }
}

function assistantData(blocks: readonly AssistantBlock[], status: 'settled' | 'running' | 'interrupted' = 'settled', turn = 1, step = 1) {
  return { status, turn, step, blocks, time: 0 }
}

function text(...lines: string[]): AssistantBlock[] {
  return lines.map(text => ({ kind: 'text', text }))
}

function think(textValue: string): AssistantBlock[] {
  return [{ kind: 'reasoning', text: textValue }]
}

const CLOSED = (turn: number, start = 1000, end = 100_000) => turnLocation(turn, 'closed', start, end)

describe('partitionChatFlow', () => {
  it('folds a closed turn’s think/tool rows into one group with the closing text split out', () => {
    const turn = CLOSED(1)
    const user = node('u', 'user', { kind: 'session' })
    const t1 = node('think1', 'assistant-step', location(turn, 1), assistantData(think('考虑一下')), 20)
    const tl1 = node('tool1', 'tool-call', location(turn, 1), { root: { callId: 'c1' } }, 30)
    const narration = node('step2', 'assistant-step', location(turn, 2), assistantData([...think('再看'), ...text('看一下现有代码')]), 40)
    const result = node('result', 'assistant-step', location(turn, 3), assistantData([...think('想好了'), ...text('已经给你落好了。')]), 50)
    const tail = node('tail', 'turn-tail', location(turn), { seq: 50 }, 60)
    const store = new Map([user, t1, tl1, narration, result, tail].map(n => [n.key, n]))

    const rows = partitionChatFlow([user.key, t1.key, tl1.key, narration.key, result.key, tail.key], key => store.get(key))

    expect(rows).toEqual([
      { kind: 'node', key: 'u', surface: 'full' },
      {
        kind: 'process-group',
        turn: 1,
        durationMs: 99_000,
        rows: [
          { key: 'think1', surface: 'full' },
          { key: 'tool1', surface: 'full' },
          { key: 'step2', surface: 'full' },
          { key: 'result', surface: 'process' },
        ],
      },
      { kind: 'node', key: 'result', surface: 'content' },
      { kind: 'node', key: 'tail', surface: 'full' },
    ])
  })

  it('keeps an open turn ungrouped', () => {
    const turn = turnLocation(1, 'open', 1000)
    const thinkNode = node('t', 'assistant-step', location(turn, 1), assistantData(think('流式思考中'), 'running'), 20)
    const result = node('r', 'assistant-step', location(turn, 1), assistantData([...think('继续想'), ...text('结果')], 'running'), 30)
    const store = new Map([[thinkNode.key, thinkNode], [result.key, result]])

    const rows = partitionChatFlow([thinkNode.key, result.key], key => store.get(key))

    expect(rows).toEqual([
      { kind: 'node', key: 't', surface: 'full' },
      { kind: 'node', key: 'r', surface: 'full' },
    ])
  })

  it('keeps a tool-only closed turn ungrouped because hiding it would hide the only answer', () => {
    const turn = CLOSED(1)
    const tool = node('t', 'tool-call', location(turn, 1), { root: { callId: 'c1' } }, 20)
    const tail = node('tail', 'turn-tail', location(turn), { seq: 20 }, 30)
    const store = new Map([[tool.key, tool], [tail.key, tail]])

    const rows = partitionChatFlow([tool.key, tail.key], key => store.get(key))

    expect(rows).toEqual([
      { kind: 'node', key: 't', surface: 'full' },
      { kind: 'node', key: 'tail', surface: 'full' },
    ])
  })

  it('splits the closing step only when it carries reasoning; its text stays full otherwise', () => {
    const turn = CLOSED(1)
    const tool = node('tw', 'tool-call', location(turn, 1), { root: { callId: 'c1' } }, 20)
    const result = node('r', 'assistant-step', location(turn, 2), assistantData(text('直接回答')), 30)
    const store = new Map([[tool.key, tool], [result.key, result]])

    const rows = partitionChatFlow([tool.key, result.key], key => store.get(key))

    expect(rows).toEqual([
      { kind: 'process-group', turn: 1, durationMs: 99_000, rows: [{ key: 'tw', surface: 'full' }] },
      { kind: 'node', key: 'r', surface: 'full' },
    ])
  })

  it('keeps non-process kinds (context, command, compaction, tail) standalone around the group', () => {
    const turn = CLOSED(1)
    const context = node('ctx', 'context', { kind: 'session' }, { seq: 1 })
    const tool = node('tw', 'tool-call', location(turn, 1), { root: {} }, 20)
    const result = node('r', 'assistant-step', location(turn, 2), assistantData([...think('想'), ...text('答')]), 30)
    const command = node('cmd', 'command', { kind: 'session' }, { seq: 3 })
    const store = new Map([[context.key, context], [tool.key, tool], [result.key, result], [command.key, command]])

    const rows = partitionChatFlow([context.key, tool.key, result.key, command.key], key => store.get(key))

    expect(rows).toEqual([
      { kind: 'node', key: 'ctx', surface: 'full' },
      {
        kind: 'process-group',
        turn: 1,
        durationMs: 99_000,
        rows: [
          { key: 'tw', surface: 'full' },
          { key: 'r', surface: 'process' },
        ],
      },
      { kind: 'node', key: 'r', surface: 'content' },
      { kind: 'node', key: 'cmd', surface: 'full' },
    ])
  })

  it('omits the duration when a turn boundary is outside the window', () => {
    const turn = turnLocation(1, 'closed')
    const tool = node('tw', 'tool-call', location(turn, 1), { root: {} }, 20)
    const result = node('r', 'assistant-step', location(turn, 2), assistantData([...think('t'), ...text('a')]), 30)
    const store = new Map([[tool.key, tool], [result.key, result]])

    const rows = partitionChatFlow([tool.key, result.key], key => store.get(key))

    expect(rows[0]).toMatchObject({ kind: 'process-group', durationMs: null })
  })

  it('groups multiple turns independently', () => {
    const t1 = CLOSED(1, 1000, 5000)
    const t2 = CLOSED(2, 6000, 9000)
    const tool1 = node('tw1', 'tool-call', location(t1, 1), { root: {} }, 20)
    const result1 = node('r1', 'assistant-step', location(t1, 2), assistantData([...think('t1'), ...text('a1')], 'settled', 1, 2), 30)
    const tool2 = node('tw2', 'tool-call', location(t2, 1), { root: {} }, 40)
    const result2 = node('r2', 'assistant-step', location(t2, 2), assistantData([...think('t2'), ...text('a2')], 'settled', 2, 2), 50)
    const store = new Map([[tool1.key, tool1], [result1.key, result1], [tool2.key, tool2], [result2.key, result2]])

    const rows = partitionChatFlow([tool1.key, result1.key, tool2.key, result2.key], key => store.get(key))

    expect(rows).toEqual([
      { kind: 'process-group', turn: 1, durationMs: 4000, rows: [{ key: 'tw1', surface: 'full' }, { key: 'r1', surface: 'process' }] },
      { kind: 'node', key: 'r1', surface: 'content' },
      { kind: 'process-group', turn: 2, durationMs: 3000, rows: [{ key: 'tw2', surface: 'full' }, { key: 'r2', surface: 'process' }] },
      { kind: 'node', key: 'r2', surface: 'content' },
    ])
  })

  it('promotes generated images from an image-tool result card onto the visible result row', () => {
    const turn = CLOSED(1)
    const imageRef = { id: 'gen-1', kind: 'image' } as never
    const imageTool = node('img', 'tool-call', location(turn, 1), {
      root: {
        kind: 'tool-result', callId: 'g1', call: { name: 'image_gen', argsRaw: '{}' },
        content: [{ type: 'image', attachment: imageRef }],
        isError: false, callView: null, resultView: null, subCalls: [],
      },
    }, 20)
    const result = node('r', 'assistant-step', location(turn, 2), assistantData(text('图片已生成。')), 30)
    const store = new Map([[imageTool.key, imageTool], [result.key, result]])

    const rows = partitionChatFlow([imageTool.key, result.key], key => store.get(key))

    expect(rows).toEqual([
      { kind: 'process-group', turn: 1, durationMs: 99_000, rows: [{ key: 'img', surface: 'full' }] },
      { kind: 'node', key: 'r', surface: 'full', images: [imageRef] },
    ])
  })

  it('promotes generated images to the image row when the turn has no text result', () => {
    const turn = CLOSED(1)
    const imageRef = { id: 'gen-2', kind: 'image' } as never
    const imageTool = node('img', 'tool-call', location(turn, 1), {
      root: {
        kind: 'tool-result', callId: 'g2', call: { name: 'image_gen', argsRaw: '{}' },
        content: [{ type: 'image', attachment: imageRef }],
        isError: false, callView: null, resultView: null, subCalls: [],
      },
    }, 20)
    const tail = node('tail', 'turn-tail', location(turn), { seq: 20 }, 30)
    const store = new Map([[imageTool.key, imageTool], [tail.key, tail]])

    const rows = partitionChatFlow([imageTool.key, tail.key], key => store.get(key))

    expect(rows).toEqual([
      // No content step carries the result, so no group forms at all and the
      // image row itself shows the promoted images.
      { kind: 'node', key: 'img', surface: 'full', images: [imageRef] },
      { kind: 'node', key: 'tail', surface: 'full' },
    ])
  })

  it('still promotes images declared through a resultView image card when content carries none', () => {
    const turn = CLOSED(1)
    const imageRef = { id: 'gen-3', kind: 'image' } as never
    const imageTool = node('img', 'tool-call', location(turn, 1), {
      root: {
        kind: 'tool-result', callId: 'g3', call: { name: 'image_gen', argsRaw: '{}' }, content: [],
        isError: false, callView: null, resultView: { card: 'image', images: [imageRef] }, subCalls: [],
      },
    }, 20)
    const result = node('r', 'assistant-step', location(turn, 2), assistantData(text('图好了')), 30)
    const store = new Map([[imageTool.key, imageTool], [result.key, result]])

    const rows = partitionChatFlow([imageTool.key, result.key], key => store.get(key))

    expect(rows).toEqual([
      { kind: 'process-group', turn: 1, durationMs: 99_000, rows: [{ key: 'img', surface: 'full' }] },
      { kind: 'node', key: 'r', surface: 'full', images: [imageRef] },
    ])
  })
})
