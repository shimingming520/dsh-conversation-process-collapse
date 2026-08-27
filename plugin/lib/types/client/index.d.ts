/**
 * Turn process collapse plugin, browser half: provides the chat view's
 * optional `chatFlowPartition` service and registers the process-group
 * disclosure into the `conversation.chat.processGroup` hole. Composing this
 * plugin out of cordis.yml turns the surface off entirely — the chat view
 * falls back to the plain one-row-per-node flow at zero cost.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** Required services for the service, slot, and dictionary registrations. */
export declare const inject: string[];
/**
 * Client plugin body: register the dictionary, the group hole, and the
 * partitioner service.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map