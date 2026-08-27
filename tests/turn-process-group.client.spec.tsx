// @vitest-environment jsdom
// TurnProcessGroup: header chrome, collapsed default, and expand interaction.

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { zh as commonZh } from '@deepseek-ai/dsh-client-locale/src/locales/zh.ts'
import { zh } from '../src/client/locales.ts'
import { TurnProcessGroup } from '../src/client/TurnProcessGroup.tsx'

afterEach(() => {
  cleanup()
})

const t = makeTranslate(zh, commonZh)
const member = (key: string) => ({ key, surface: 'full' as const })

describe('TurnProcessGroup', () => {
  it('renders a collapsed duration header and hides the member rows', () => {
    render(
      <TurnProcessGroup
        turn={2}
        durationMs={83_000}
        rows={[member('a'), member('b'), member('c'), member('d')]}
        renderMember={memberSpec => <span data-testid="member">{memberSpec.key}</span>}
        t={t}
      />,
    )
    expect(screen.getByText('已处理 1分23秒')).toBeTruthy()
    expect(screen.getByText('· 4 步')).toBeTruthy()
    expect(screen.queryByTestId('member')).toBeNull()
  })

  it('expands and collapses the member rows from the header row', () => {
    render(
      <TurnProcessGroup
        turn={2}
        durationMs={83_000}
        rows={[member('a'), member('b')]}
        renderMember={memberSpec => <span data-testid="member">{memberSpec.key}</span>}
        t={t}
      />,
    )
    const header = screen.getByText('已处理 1分23秒').closest('[data-disclosure-row]')
    expect(header).not.toBeNull()
    expect(header?.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(header as HTMLElement)
    expect(screen.getAllByTestId('member')).toHaveLength(2)
    expect(header?.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(header as HTMLElement)
    expect(screen.queryByTestId('member')).toBeNull()
    expect(header?.getAttribute('aria-expanded')).toBe('false')
  })

  it('omits the duration label when the turn boundary is outside the window', () => {
    render(
      <TurnProcessGroup
        turn={2}
        durationMs={null}
        rows={[member('a'), member('b'), member('c')]}
        renderMember={memberSpec => <span data-testid="member">{memberSpec.key}</span>}
        t={t}
      />,
    )
    expect(screen.getByText('已处理')).toBeTruthy()
    expect(screen.getByText('· 3 步')).toBeTruthy()
  })
})
