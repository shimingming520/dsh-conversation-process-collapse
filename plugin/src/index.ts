/**
 * Turn process collapse plugin, node half.
 *
 * Deliberately empty: folding a settled turn's process rows is a browser
 * rendering choice, and the plugin's state (turn boundaries, process members)
 * is already in the session snapshot the client renders. Nothing here reaches
 * a model request, so no host-side surface exists.
 */

/** Host plugin body — the browser half owns the whole feature. */
export function apply(): void {}
