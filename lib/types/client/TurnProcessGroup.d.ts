import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { ChatProcessGroupOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client';
/** Full props of the process-group hole: owner currency & locale seat. */
export type TurnProcessGroupProps = ChatProcessGroupOwnerProps & PropsLocale<'conversationProcess'>;
/**
 * One settled turn's collapsed process: a compact disclosure header (duration
 * plus member count) that expands into the turn's Think rows, tool rows, and
 * intermediate narration. The result message renders outside this group, so
 * the collapsed flow reads as question → answer; expanding recovers the
 * complete step trail through the owner-provided member renderer.
 */
export declare function TurnProcessGroup({ turn, durationMs, rows, renderMember, t, }: TurnProcessGroupProps): import("react").JSX.Element;
//# sourceMappingURL=TurnProcessGroup.d.ts.map