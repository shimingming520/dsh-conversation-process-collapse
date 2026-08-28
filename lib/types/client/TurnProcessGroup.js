import { jsx as _jsx } from "react/jsx-runtime";
import { Fragment, useState } from 'react';
import { DisclosureRow, IconSparkle16 } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './TurnProcessGroup.module.css';
function pad2(n) {
    return String(n).padStart(2, '0');
}
/**
 * Localized elapsed-duration label in whole seconds.
 * @param ms - Elapsed milliseconds (negatives clamp to zero).
 * @param t - Translate seat supplying the duration templates.
 * @returns Display string in whole seconds.
 */
function formatRunDuration(ms, t) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return minutes > 0
        ? t('duration.minutes', { minutes, seconds: pad2(seconds) })
        : t('duration.seconds', { seconds });
}
/**
 * One settled turn's collapsed process: a compact disclosure header (duration
 * plus member count) that expands into the turn's Think rows, tool rows, and
 * intermediate narration. The result message renders outside this group, so
 * the collapsed flow reads as question → answer; expanding recovers the
 * complete step trail through the owner-provided member renderer.
 */
export function TurnProcessGroup({ turn, durationMs, rows, renderMember, t, }) {
    const [open, setOpen] = useState(false);
    return (_jsx("div", { className: css.group, "data-turn-process": turn, children: _jsx(DisclosureRow, { rowClassName: css.row, titleClassName: css.title, chevronClassName: css.chevron, icon: _jsx(IconSparkle16, { size: 14 }), title: durationMs === null
                ? t('process.title')
                : t('process.title.duration', { duration: formatRunDuration(durationMs, t) }), collapsedContent: (_jsx("span", { className: css.count, children: t('process.count', { count: rows.length }) })), open: open, expandable: true, expandOnRowClick: true, onToggle: () => { setOpen(value => !value); }, children: _jsx("div", { className: css.body, children: rows.map(member => _jsx(Fragment, { children: renderMember(member) }, member.key)) }) }) }));
}
//# sourceMappingURL=TurnProcessGroup.js.map