import { TurnProcessGroup } from "./TurnProcessGroup.js";
import { chatFlowPartitioner } from "./turn-process.js";
import { en, NS, zh } from "./locales.js";
/** Required services for the service, slot, and dictionary registrations. */
export const inject = ['slots', 'locale'];
/**
 * Client plugin body: register the dictionary, the group hole, and the
 * partitioner service.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-turn-process-collapse: dictionaries');
    ctx.slots.inject('conversation.chat.processGroup', () => ctx.slots.register({ name: 'conversation.chat.processGroup', locale: NS }, TurnProcessGroup));
    // The chat view reaches this face via ctx.get, so its absence — this plugin
    // composed out — is the off state: the plain flow renders every row.
    ctx.provide('chatFlowPartition', chatFlowPartitioner);
}
//# sourceMappingURL=index.js.map