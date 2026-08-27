/** `conversationProcess` namespace dictionaries for the turn process group. */
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Turn process-group copy. */
        conversationProcess: ProcessGroupKey;
    }
}
/** Dictionary namespace owned by this plugin. */
export declare const NS = "conversationProcess";
/** The process-group key union. */
export type ProcessGroupKey = keyof typeof zh;
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    'process.title': string;
    'process.title.duration': string;
    'process.count': string;
    'duration.seconds': string;
    'duration.minutes': string;
};
/** English dictionary, checked complete against the zh key set. */
export declare const en: {
    'process.title': string;
    'process.title.duration': string;
    'process.count': string;
    'duration.seconds': string;
    'duration.minutes': string;
};
//# sourceMappingURL=locales.d.ts.map