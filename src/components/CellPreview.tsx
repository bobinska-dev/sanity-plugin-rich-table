import {ComponentType} from 'react'
import {FieldMember, MemberField, ObjectInputProps} from 'sanity'
import {styled} from 'styled-components'

// Styled wrapper that makes preview non-interactive and hides toolbar
const CellPreviewWrapper = styled.div`
  pointer-events: none;
  font-size: 0.875rem;
  max-height: 100px;
  overflow: hidden !important;

  /* Hide any scrollbars */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }

  /* Hide the PTE toolbar */
  [data-testid='pt-editor__toolbar-card'] {
    display: none !important;
  }

  /* Make all children non-interactive */
  * {
    pointer-events: none !important;
    user-select: none !important;
  }
`

export interface CellPreviewProps {
  member: FieldMember
  renderInput: ObjectInputProps['renderInput']
  renderField: ObjectInputProps['renderField']
  renderItem: ObjectInputProps['renderItem']
  renderPreview: ObjectInputProps['renderPreview']
  renderBlock: ObjectInputProps['renderBlock']
  renderInlineBlock: ObjectInputProps['renderInlineBlock']
  renderAnnotation: ObjectInputProps['renderAnnotation']
}

/**
 * Read-only cell preview component.
 * Renders a non-interactive preview of cell content with hidden toolbar and scrollbars.
 */
const CellPreview: ComponentType<CellPreviewProps> = ({
  member,
  renderInput,
  renderItem,
  renderPreview,
  renderBlock,
  renderInlineBlock,
  renderAnnotation,
}) => {
  return (
    <CellPreviewWrapper>
      <MemberField
        member={member}
        renderInput={(inputProps) => renderInput({...inputProps, readOnly: true} as any)}
        renderField={(fieldProps) => fieldProps.children}
        renderItem={renderItem}
        renderPreview={renderPreview}
        renderBlock={renderBlock}
        renderInlineBlock={renderInlineBlock}
        renderAnnotation={renderAnnotation}
      />
    </CellPreviewWrapper>
  )
}

export default CellPreview
