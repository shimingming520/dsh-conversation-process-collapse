import { Fragment, useState } from 'react'
import { DisclosureRow, IconSparkle16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { ChatProcessGroupOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import css from './TurnProcessGroup.module.css'

/** The duration-template share of the conversationProcess dictionary. */
type DurationTranslate = PropsLocale<'conversationProcess'>['t']

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Localized elapsed-duration label in whole seconds.
 * @param ms - Elapsed milliseconds (negatives clamp to zero).
 * @param t - Translate seat supplying the duration templates.
 * @returns Display string in whole seconds.
 */
function formatRunDuration(ms: number, t: DurationTranslate): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return minutes > 0
    ? t('duration.minutes', { minutes, seconds: pad2(seconds) })
    : t('duration.seconds', { seconds })
}

/** Full props of the process-group hole: owner currency & locale seat. */
export type TurnProcessGroupProps =
  ChatProcessGroupOwnerProps & PropsLocale<'conversationProcess'>

/**
 * One settled turn's collapsed process: a compact disclosure header (duration
 * plus member count) that expands into the turn's Think rows, tool rows, and
 * intermediate narration. The result message renders outside this group, so
 * the collapsed flow reads as question → answer; expanding recovers the
 * complete step trail through the owner-provided member renderer.
 */
export function TurnProcessGroup({
  turn, durationMs, rows, renderMember, t,
}: TurnProcessGroupProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className={css.group} data-turn-process={turn}>
      <DisclosureRow
        rowClassName={css.row}
        titleClassName={css.title}
        chevronClassName={css.chevron}
        icon={<IconSparkle16 size={14} />}
        title={durationMs === null
          ? t('process.title')
          : t('process.title.duration', { duration: formatRunDuration(durationMs, t) })}
        collapsedContent={(
          <span className={css.count}>{t('process.count', { count: rows.length })}</span>
        )}
        open={open}
        expandable
        expandOnRowClick
        onToggle={() => { setOpen(value => !value) }}
      >
        <div className={css.body}>
          {rows.map(member => <Fragment key={member.key}>{renderMember(member)}</Fragment>)}
        </div>
      </DisclosureRow>
    </div>
  )
}
