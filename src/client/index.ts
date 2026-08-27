/**
 * Turn process collapse plugin, browser half: provides the chat view's
 * optional `chatFlowPartition` service and registers the process-group
 * disclosure into the `conversation.chat.processGroup` hole. Composing this
 * plugin out of cordis.yml turns the surface off entirely — the chat view
 * falls back to the plain one-row-per-node flow at zero cost.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { TurnProcessGroup } from './TurnProcessGroup.tsx'
import { chatFlowPartitioner } from './turn-process.ts'
import { en, NS, zh } from './locales.ts'

/** Required services for the service, slot, and dictionary registrations. */
export const inject = ['slots', 'locale']

/**
 * Client plugin body: register the dictionary, the group hole, and the
 * partitioner service.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-turn-process-collapse: dictionaries')
  ctx.slots.inject('conversation.chat.processGroup', () => ctx.slots.register(
    { name: 'conversation.chat.processGroup', locale: NS },
    TurnProcessGroup,
  ))
  // The chat view reaches this face via ctx.get, so its absence — this plugin
  // composed out — is the off state: the plain flow renders every row.
  ctx.provide('chatFlowPartition', chatFlowPartitioner)
}
