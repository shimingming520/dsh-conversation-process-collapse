
    'use strict'
    const exports = {}

    const STYLE_ID = 'dsh-turn-process-collapse-style'
    const SUMMARY_CLASS = 'tp-process-summary'
    const CHEVRON_CLASS = 'tp-process-chevron'
    const TITLE_CLASS = 'tp-process-title'
    const COUNT_CLASS = 'tp-process-count'
    const HIDDEN_PROP = '__tpOriginalDisplay'

    const STYLE = `
.tp-process-summary {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  min-height: 24px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #8b8f99);
  font: 400 14px/24px system-ui, -apple-system, "Segoe UI", sans-serif;
  cursor: pointer;
  user-select: none;
  text-align: left;
}
.tp-process-summary:hover {
  color: var(--dsw-alias-label-primary, #f5f5f5);
}
.tp-process-summary:focus-visible {
  outline: 2px solid var(--dsw-alias-state-focus-ring, rgba(77, 107, 254, 0.8));
  outline-offset: 2px;
}
.tp-process-title {
  font-weight: 400;
}
.tp-process-count {
  color: var(--dsw-alias-label-caption, rgba(127, 127, 127, 0.8));
}
.tp-process-chevron {
  display: inline-block;
  width: 14px;
  height: 14px;
  color: var(--dsw-alias-label-tertiary, #8b8f99);
  transition: transform 0.12s ease;
  transform: rotate(-90deg);
  opacity: 0.7;
}
.tp-process-summary[aria-expanded="true"] .tp-process-chevron {
  transform: rotate(0deg);
}
`

    function injectStyle() {
      if (document.getElementById(STYLE_ID) !== null) return
      const style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent = STYLE
      document.head.appendChild(style)
    }

    function findFlow() {
      const flows = document.querySelectorAll('[data-chat-flow]')
      for (const flow of flows) {
        if (flow.offsetParent !== null || flow.getBoundingClientRect().width > 0) return flow
      }
      return flows[0] ?? null
    }

    function flowItems(flow) {
      return Array.from(flow.children).filter((el) =>
        el instanceof HTMLElement &&
        !el.classList.contains(SUMMARY_CLASS) &&
        !el.classList.contains('tp-process-group')
      )
    }

    function kindOf(el) {
      return el.getAttribute('data-chat-flow-kind') || ''
    }

    function keyOf(el) {
      return el.getAttribute('data-chat-flow-key') || el.getAttribute('data-chat-anchor-key') || ''
    }

    function hasBodyText(el) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let node
      while ((node = walker.nextNode()) !== null) {
        if (node.data.trim() === '') continue
        const parent = node.parentElement
        if (parent !== null && parent.closest(
          '[data-variant="think"], [data-chat-call-id], .tp-process-summary, .tp-process-group'
        ) !== null) continue
        return true
      }
      if (el.querySelector('img, video, audio, canvas') !== null) return true
      return false
    }

    function isProcessKind(kind) {
      return kind === 'tool-call' ||
        kind === 'model-retry' ||
        kind === 'workflow-run' ||
        kind === 'command' ||
        kind === 'manual-compaction' ||
        kind === 'context'
    }

    function buildSegments(items) {
      const segments = []
      let start = null
      for (let i = 0; i < items.length; i++) {
        const kind = kindOf(items[i])
        if (kind === 'turn-tail') {
          if (start !== null) {
            segments.push({ start, end: i + 1, closed: true })
            start = null
          }
          continue
        }
        if (kind === 'user' || kind === 'steering') {
          if (start !== null) {
            segments.push({ start, end: i, closed: false })
          }
          start = i
        }
      }
      if (start !== null) {
        segments.push({ start, end: items.length, closed: false })
      }
      return segments
    }

    function segmentKey(items, segment) {
      const first = items[segment.start]
      const key = keyOf(first)
      return 'seg:' + (key || String(segment.start))
    }

    function isZh() {
      const lang = (document.documentElement.getAttribute('lang') || navigator.language || 'en').toLowerCase()
      return lang.startsWith('zh')
    }

    function formatDuration(ms) {
      if (!Number.isFinite(ms) || ms <= 0) return ''
      const total = Math.floor(ms / 1000)
      const minutes = Math.floor(total / 60)
      const seconds = total % 60
      if (minutes > 0) {
        return isZh()
          ? minutes + '分' + String(seconds).padStart(2, '0') + '秒'
          : minutes + 'm ' + String(seconds).padStart(2, '0') + 's'
      }
      return isZh() ? seconds + '秒' : seconds + 's'
    }

    function durationFromTail(tail) {
      if (!tail) return undefined
      const text = tail.textContent || ''
      let m = text.match(/用时\s*(\d+)分(\d+)秒|用时\s*(\d+)秒/)
      if (m !== null) {
        if (m[1] !== undefined && m[2] !== undefined) {
          return Number(m[1]) * 60000 + Number(m[2]) * 1000
        }
        if (m[3] !== undefined) return Number(m[3]) * 1000
        return undefined
      }
      // Fallback: try a simple "s" / "ms" suffix.
      m = text.match(/(\d+(?:\.\d+)?)\s*s\b/i)
      if (m !== null) return Number(m[1]) * 1000
      return undefined
    }

    function createSummary(durationMs, stepCount) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = SUMMARY_CLASS
      btn.setAttribute('aria-expanded', 'false')

      const title = document.createElement('span')
      title.className = TITLE_CLASS
      const duration = formatDuration(durationMs)
      title.textContent = duration === ''
        ? (isZh() ? '已处理' : 'Processed')
        : (isZh() ? '已处理 ' + duration : 'Processed in ' + duration)

      const count = document.createElement('span')
      count.className = COUNT_CLASS
      count.textContent = isZh()
        ? '· ' + stepCount + ' 步'
        : '· ' + stepCount + ' steps'

      const chevron = document.createElement('span')
      chevron.className = CHEVRON_CLASS
      chevron.textContent = '▸'

      btn.append(title, count, chevron)
      btn.title = isZh() ? '展开工作过程' : 'Expand process'
      return btn
    }

    function saveDisplay(el) {
      if (el[HIDDEN_PROP] === undefined) el[HIDDEN_PROP] = el.style.display || ''
    }

    function hide(el) {
      saveDisplay(el)
      el.style.display = 'none'
    }

    function show(el) {
      const original = el[HIDDEN_PROP]
      if (original !== undefined) {
        el.style.display = original
      } else {
        el.style.removeProperty('display')
      }
    }

    function setExpanded(state, open) {
      state.open = open
      state.summary.setAttribute('aria-expanded', open ? 'true' : 'false')
      for (const el of state.hidden) {
        if (el.isConnected) {
          if (open) show(el)
          else hide(el)
        }
      }
    }

    class Controller {
      constructor() {
        this.flow = null
        this.states = new Map()
        this.observer = null
        this.raf = 0
        this.disposed = false
      }

      start() {
        injectStyle()
        this.flow = findFlow()
        if (this.flow === null) {
          // Chat may mount later; watch the document for the flow container.
          this.observer = new MutationObserver(() => this.schedule())
          this.observer.observe(document.documentElement, { childList: true, subtree: true })
          this.schedule()
          return
        }
        this.observer = new MutationObserver(() => this.schedule())
        this.observer.observe(this.flow, { childList: true, subtree: true })
        this.schedule()
      }

      stop() {
        this.disposed = true
        if (this.raf !== 0) cancelAnimationFrame(this.raf)
        if (this.observer !== null) this.observer.disconnect()
        this.cleanup()
      }

      schedule() {
        if (this.disposed) return
        if (this.raf !== 0) return
        this.raf = requestAnimationFrame(() => {
          this.raf = 0
          this.pass()
        })
      }

      cleanup() {
        for (const state of this.states.values()) {
          if (state.summary.isConnected) state.summary.remove()
          for (const el of state.hidden) {
            if (el.isConnected) show(el)
          }
        }
        this.states.clear()
      }

      pass() {
        if (this.disposed) return
        const flow = findFlow()
        if (flow === null) return
        if (this.flow !== flow) {
          this.flow = flow
          if (this.observer !== null) this.observer.disconnect()
          this.observer = new MutationObserver(() => this.schedule())
          this.observer.observe(flow, { childList: true, subtree: true })
        }

        const items = flowItems(flow)
        const segments = buildSegments(items)
        const activeKeys = new Set()

        for (const segment of segments) {
          if (!segment.closed) continue
          const key = segmentKey(items, segment)
          const tail = items[segment.end - 1] && kindOf(items[segment.end - 1]) === 'turn-tail'
            ? items[segment.end - 1]
            : null

          const range = items.slice(segment.start + 1, segment.end - (tail ? 1 : 0))
          let finalIndex = -1
          for (let i = range.length - 1; i >= 0; i--) {
            const kind = kindOf(range[i])
            if ((kind === 'assistant-step' || kind === 'assistant') && hasBodyText(range[i])) {
              finalIndex = i
              break
            }
          }
          if (finalIndex === -1) {
            // No content-bearing assistant step -> keep the plain flow.
            this.removeState(key)
            continue
          }

          const finalEl = range[finalIndex]
          const processItems = []
          for (let i = 0; i < range.length; i++) {
            if (i === finalIndex) continue
            const kind = kindOf(range[i])
            if (kind === 'user' || kind === 'steering' || kind === 'turn-tail') continue
            if (kind === 'assistant-step' || kind === 'assistant' || isProcessKind(kind)) {
              processItems.push(range[i])
            }
          }

          // Also hide reasoning rows inside the final answer itself.
          const finalThinkRows = Array.from(finalEl.querySelectorAll('[data-variant="think"]'))
            .filter((el) => el.closest('[data-chat-call-id]') === null)

          const hidden = [...processItems, ...finalThinkRows]
          if (hidden.length === 0) {
            this.removeState(key)
            continue
          }

          const firstProcess = processItems.length > 0 ? processItems[0] : finalEl
          const durationMs = durationFromTail(tail)
          let state = this.states.get(key)
          if (state === undefined || !state.summary.isConnected || state.hidden.some(el => !el.isConnected)) {
            // Tear down a stale state, then rebuild preserving open preference.
            const wasOpen = state !== undefined ? state.open : false
            this.removeState(key)
            state = {
              summary: null,
              hidden,
              open: wasOpen,
            }
            const summary = createSummary(durationMs, hidden.length)
            summary.addEventListener('click', () => {
              const current = this.states.get(key)
              if (current !== undefined) setExpanded(current, !current.open)
            })
            firstProcess.parentNode.insertBefore(summary, firstProcess)
            state.summary = summary
            this.states.set(key, state)
            setExpanded(state, state.open)
          } else {
            // Keep existing state; refresh if the DOM nodes changed.
            // Show previously hidden nodes that are no longer part of this group.
            for (const el of state.hidden) {
              if (el.isConnected && !hidden.includes(el)) show(el)
            }
            state.hidden = hidden
            state.summary.parentNode.insertBefore(state.summary, firstProcess)
            setExpanded(state, state.open)
          }
          activeKeys.add(key)
        }

        for (const key of Array.from(this.states.keys())) {
          if (!activeKeys.has(key)) this.removeState(key)
        }
      }

      removeState(key) {
        const state = this.states.get(key)
        if (state === undefined) return
        if (state.summary.isConnected) state.summary.remove()
        for (const el of state.hidden) {
          if (el.isConnected) show(el)
        }
        this.states.delete(key)
      }
    }

    exports.inject = []

    exports.apply = function apply(ctx) {
      const controller = new Controller()
      controller.start()
      ctx.effect(() => controller.stop())
    }

export const inject = exports.inject
export const apply = exports.apply
