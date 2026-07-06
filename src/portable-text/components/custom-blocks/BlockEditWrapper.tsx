import type {ComponentType, ReactNode} from 'react'
import type {Path} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

/**
 * Wraps a block object's in-cell preview so double-clicking it opens the block in
 * Sanity's native edit form — the same `useDocumentPane().onPathOpen(path)` the
 * toolbar's {@link BlockPopover} uses. `stopPropagation` keeps the double-click
 * from also bubbling to the table's expand-on-double-click handler.
 */
const BlockEditWrapper: ComponentType<{path: Path; children: ReactNode}> = ({path, children}) => {
  const {onPathOpen} = useDocumentPane()
  return (
    <div
      onDoubleClick={(event) => {
        event.stopPropagation()
        onPathOpen(path)
      }}
      style={{cursor: 'pointer'}}
    >
      {children}
    </div>
  )
}

export default BlockEditWrapper
