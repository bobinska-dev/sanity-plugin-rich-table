import {
  autoUpdate,
  flip,
  offset,
  type ReferenceType,
  shift,
  useFloating,
} from '@floating-ui/react-dom'
import {Card} from '@sanity/ui'
import type {ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {styled} from 'styled-components'

interface FloatingPanelProps {
  getAnchorRect: () => DOMRect | null
  children: ReactNode
  offset?: number
}

const Panel = styled(Card)`
  z-index: 50;
  overflow: hidden;
  background-clip: padding-box;
`
export function FloatingPanel({
  getAnchorRect,
  children,
  offset: offsetValue = 4,
}: FloatingPanelProps) {
  const {floatingStyles, refs} = useFloating({
    placement: 'bottom-start',
    middleware: [
      offset(offsetValue),
      flip({fallbackPlacements: ['top-start']}),
      shift({padding: 8}),
    ],
    whileElementsMounted: autoUpdate,
    elements: {
      reference: createVirtualElement(getAnchorRect),
    },
  })
  const {setFloating} = refs

  return createPortal(
    <Panel
      ref={setFloating}
      style={floatingStyles}
      padding={3}
      border
      radius={3}
      aria-label={'Floating panel'}
    >
      {children}
    </Panel>,
    document.body,
  )
}

function createVirtualElement(getRect: () => DOMRect | null): ReferenceType | null {
  return {
    getBoundingClientRect: () => getRect() ?? new DOMRect(),
  }
}
