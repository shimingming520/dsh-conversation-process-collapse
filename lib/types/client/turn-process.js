/** Read an image result card off a settled tool result view, if present. */
function imageCardOf(view) {
    if (typeof view !== 'object' || view === null)
        return undefined;
    const record = view;
    if (record.card !== 'image')
        return undefined;
    return Array.isArray(record.images)
        ? { card: 'image', images: record.images }
        : undefined;
}
/** Node kinds that are always their turn's process noise rather than results. */
const PROCESS_KINDS = new Set(['tool-call', 'model-retry', 'workflow-run']);
/** Whether these blocks carry durable result content (text/images/other). */
function hasResultContent(blocks) {
    return blocks.some((block) => {
        if (block.kind === 'text')
            return block.text.trim() !== '';
        return block.kind === 'image' || block.kind === 'other';
    });
}
/** Whether these blocks carry a non-blank reasoning block worth splitting out. */
function hasReasoning(blocks) {
    return blocks.some(block => block.kind === 'reasoning' && block.text.trim() !== '');
}
/** Extract promoted images from a settled tool result row.
 *  Reads durable image blocks from the result `content` first (the shape any
 *  tool with image output shares — dsh-imagegen returns its attachments
 *  there), then falls back to a structurally recognized `resultView` image
 *  card, so no tool-specific card union needs importing. */
function imageRefsFor(value) {
    if (value.kind !== 'tool-call')
        return [];
    const root = value.data.root;
    if (!('kind' in root))
        return [];
    const fromContent = root.content.flatMap(block => block.type === 'image' ? [block.attachment] : []);
    return fromContent.length > 0 ? fromContent : (imageCardOf(root.resultView)?.images ?? []);
}
function nodeRow(key, surface, turn, byTurn) {
    if (turn === undefined)
        return { kind: 'node', key, surface };
    const plan = byTurn.get(turn);
    const images = plan !== undefined && (plan.resultKey === key || (plan.resultKey === undefined && plan.imageKey === key))
        ? plan.images
        : undefined;
    return images !== undefined && images.length > 0
        ? { kind: 'node', key, surface, images }
        : { kind: 'node', key, surface };
}
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
export function partitionChatFlow(order, node) {
    const byTurn = new Map();
    for (const key of order) {
        const value = node(key);
        if (value === undefined)
            continue;
        const location = value.location;
        if (location.kind !== 'turn' && location.kind !== 'step')
            continue;
        const turn = location.turn.turn;
        const current = byTurn.get(turn) ?? {
            closed: location.turn.status === 'closed',
            keys: [],
            resultKey: undefined,
            durationMs: null,
            images: [],
            imageKey: undefined,
        };
        current.keys.push(key);
        if (value.kind === 'assistant-step' && hasResultContent(value.data.blocks)) {
            current.resultKey = key;
        }
        if (value.kind === 'tool-call') {
            const generated = imageRefsFor(value);
            if (generated.length > 0) {
                current.images = [...current.images, ...generated];
                current.imageKey = key;
            }
        }
        const { start, end } = location.turn;
        if (start !== undefined && end !== undefined)
            current.durationMs = end.time - start.time;
        byTurn.set(turn, current);
    }
    const groups = new Map();
    for (const [turn, plan] of byTurn) {
        if (!plan.closed || plan.resultKey === undefined)
            continue;
        const rows = [];
        let splitKey;
        for (const key of plan.keys) {
            const value = node(key);
            if (value === undefined)
                continue;
            if (value.kind === 'assistant-step') {
                if (key === plan.resultKey) {
                    if (hasReasoning(value.data.blocks)) {
                        rows.push({ key, surface: 'process' });
                        splitKey = key;
                    }
                    continue;
                }
                rows.push({ key, surface: 'full' });
                continue;
            }
            if (PROCESS_KINDS.has(value.kind))
                rows.push({ key, surface: 'full' });
        }
        if (rows.length === 0)
            continue;
        groups.set(turn, { splitKey, durationMs: plan.durationMs, rows });
    }
    const rows = [];
    const emitted = new Set();
    for (const key of order) {
        const value = node(key);
        const turn = value === undefined ? undefined : turnOf(value);
        if (turn !== undefined) {
            const group = groups.get(turn);
            if (group !== undefined) {
                // The split closing step is a group member (its reasoning face) AND
                // owns a standalone content face: the content row wins its own
                // position, the group carries the reasoning face.
                if (key === group.splitKey) {
                    rows.push(nodeRow(key, 'content', turn, byTurn));
                    continue;
                }
                if (group.rows.some(row => row.key === key)) {
                    if (emitted.has(turn))
                        continue;
                    emitted.add(turn);
                    rows.push({ kind: 'process-group', turn, durationMs: group.durationMs, rows: group.rows });
                    continue;
                }
            }
        }
        rows.push(nodeRow(key, 'full', turn, byTurn));
    }
    return rows;
}
function turnOf(value) {
    const location = value.location;
    return location.kind === 'turn' || location.kind === 'step' ? location.turn.turn : undefined;
}
/** The chat view's optional service face: the partitioner is the whole plugin. */
export const chatFlowPartitioner = {
    partition: partitionChatFlow,
};
//# sourceMappingURL=turn-process.js.map