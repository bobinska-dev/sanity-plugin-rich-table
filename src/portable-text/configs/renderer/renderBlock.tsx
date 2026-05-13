import {RenderBlockFunction} from '@portabletext/editor'

export const renderBlock: RenderBlockFunction = (props) => {
  if (props.listItem) return props.children
  return <div style={{padding: '0.25rem 0'}}>{props.children}</div>
}
