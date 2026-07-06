/**
 * Shared tint colors for diff highlights and inline validation errors — one source
 * of truth instead of the same literals scattered across the diff and annotation
 * renderers.
 *
 * The `*_BG` values are intentionally **semi-transparent**: they overlay whatever
 * (themed) card / editor background sits behind them, so they read correctly in
 * both light and dark mode without needing a per-scheme lookup. `CRITICAL_TEXT` is
 * Sanity's critical red, used for error text where an opaque colour is required.
 */
export const DIFF_ADDED_BG = 'rgba(38, 175, 95, 0.22)'
export const DIFF_REMOVED_BG = 'rgba(244, 84, 84, 0.18)'
export const CRITICAL_TEXT = 'rgb(244, 84, 84)'
