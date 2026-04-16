import {RenderBlockFunction} from '@portabletext/editor'

export const renderBlock: RenderBlockFunction = (props) => {
  // Block objects (non-text blocks) — schemaType.name !== 'block'
  if (props.schemaType?.name !== 'block') {
    const typeName = props.schemaType?.title ?? props.schemaType?.name ?? 'Object'
    return (
      <div
        style={{
          padding: '0.5rem',
          margin: '0.25rem 0',
          border: '1px dashed var(--card-border-color, #ccc)',
          borderRadius: '4px',
          background: 'var(--card-bg2-color, #f6f6f8)',
          userSelect: 'none',
          cursor: 'default',
          fontSize: '0.8125rem',
          color: 'var(--card-muted-fg-color, #6e7683)',
        }}
      >
        <strong>{typeName}</strong>
        {props.children}
      </div>
    )
  }

  if (props.listItem) return props.children
  return <div style={{padding: '0.25rem 0'}}>{props.children}</div>
}
