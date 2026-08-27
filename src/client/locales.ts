/** `conversationProcess` namespace dictionaries for the turn process group. */

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Turn process-group copy. */
    conversationProcess: ProcessGroupKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'conversationProcess'

/** The process-group key union. */
export type ProcessGroupKey = keyof typeof zh

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'process.title': '已处理',
  'process.title.duration': '已处理 {duration}',
  'process.count': '· {count} 步',
  'duration.seconds': '{seconds}秒',
  'duration.minutes': '{minutes}分{seconds}秒',
} satisfies Record<string, string>

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'process.title': 'Processed',
  'process.title.duration': 'Processed in {duration}',
  'process.count': '· {count} steps',
  'duration.seconds': '{seconds}s',
  'duration.minutes': '{minutes}m {seconds}s',
} satisfies Record<ProcessGroupKey, string>
