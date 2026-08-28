/**
 * Turn process collapse plugin, browser half: a pure DOM implementation that
 * watches the rendered chat flow and collapses settled turns' process rows.
 */
/** Client plugin has no required services. */
export declare const inject: string[];
/**
 * Client plugin body: start the DOM collapse controller.
 * @param ctx - client root context.
 */
export declare function apply(ctx: any): void;
