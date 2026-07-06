/**
 * Finds the nearest scrollable ancestor of `element` (an element whose computed
 * `overflow-y` allows scrolling), or `null` if there isn't one.
 */
function getScrollParent(element: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = element.parentElement
  while (node) {
    const {overflowY} = window.getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return node
    }
    node = node.parentElement
  }
  return null
}

/**
 * Reveals `element` inside its own scroll container **without** scrolling any
 * outer scrollport (the page / Studio pane).
 *
 * `Element.scrollIntoView()` scrolls every scrollable ancestor, so in a portaled
 * popover — like the slash-command and emoji pickers — pressing Arrow Down past
 * the fold scrolls the whole viewport and the popover appears to "jump". This
 * adjusts only the nearest scroll container's `scrollTop` to bring the active
 * option just into view.
 */
export function scrollOptionIntoView(element: HTMLElement): void {
  const container = getScrollParent(element)
  if (!container) return

  // At the ends, scroll to the container's extreme. Browsers routinely omit a
  // scroll container's bottom padding and the last child's margin from the
  // scrollable area, so edge-aligning the last option lands a few px short and
  // clips it; scrolling fully to the end (the browser clamps) reveals it whole.
  if (element === container.firstElementChild) {
    container.scrollTop = 0
    return
  }
  if (element === container.lastElementChild) {
    container.scrollTop = container.scrollHeight
    return
  }

  const elementRect = element.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()

  if (elementRect.top < containerRect.top) {
    container.scrollTop -= containerRect.top - elementRect.top
  } else if (elementRect.bottom > containerRect.bottom) {
    container.scrollTop += elementRect.bottom - containerRect.bottom
  }
}
