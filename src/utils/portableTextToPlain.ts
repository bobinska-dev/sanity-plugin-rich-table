/**
 * Extract a plain-text representation of Portable Text content for display in
 * the read-only "Review changes" diff view.
 *
 * This is intentionally lossy — marks, annotations and formatting are dropped —
 * and, importantly, it must **never throw**: it runs inside the diff renderer,
 * where an exception would blank the whole change with a red error card.
 * Malformed or unexpected input therefore falls back to an empty string.
 */
export function portableTextToPlain(blocks: unknown): string {
  if (!Array.isArray(blocks)) return ''

  try {
    return blocks
      .map((block) => {
        if (!block || typeof block !== 'object') return ''
        const {_type, children} = block as {
          _type?: string
          children?: Array<{text?: unknown} | null | undefined>
        }

        // Standard text block: concatenate the text of its spans.
        if (Array.isArray(children)) {
          return children
            .map((child) => (child && typeof child.text === 'string' ? child.text : ''))
            .join('')
        }

        // Non-text member (e.g. an image or nested object): show a placeholder
        // so the cell isn't rendered as empty.
        return _type && _type !== 'block' ? `[${_type}]` : ''
      })
      .filter(Boolean)
      .join('\n')
  } catch {
    return ''
  }
}
