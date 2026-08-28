import type { ChatConversationViewNode } from '@deepseek-ai/dsh-client-runtime/client';
import type { ChatFlowPartitioner, ChatFlowRow } from '@deepseek-ai/dsh-client-ui-conversation/client';
/**
 * Partition the ordered Chat flow into standalone rows and per-turn process
 * groups. A turn groups only while it is CLOSED and has a content-bearing
 * assistant-step (otherwise grouping would hide the turn's only answer):
 * its non-result rows fold into one collapsible group at the first member's
 * position, and the result step splits there when it also carries reasoning.
 * Image outputs from settled tool results — durable image blocks in the
 * result content, or a structurally recognized `resultView` image card — are
 * promoted to the turn's visible result row so they appear in the final
 * answer instead of staying hidden inside the collapsed process.
 * Open and unknown-status turns keep today's ungrouped flow so live
 * streaming never moves rows.
 * @param order - visible Chat Node keys in flow order.
 * @param node - store read for one key.
 * @returns render rows in flow order.
 */
export declare function partitionChatFlow(order: readonly string[], node: (key: string) => ChatConversationViewNode | undefined): ChatFlowRow[];
/** The chat view's optional service face: the partitioner is the whole plugin. */
export declare const chatFlowPartitioner: ChatFlowPartitioner;
//# sourceMappingURL=turn-process.d.ts.map