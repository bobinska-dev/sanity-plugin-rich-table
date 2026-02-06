import {RenderBlockFunction} from '@portabletext/editor'
import ImageBlock from '../../components/custom-blocks/ImageBlock'
import DefaultCustomBlock from '../../components/custom-blocks/DefautCustomBlock'

export const renderBlock: RenderBlockFunction = (props) => {
  if (props.listItem) return props.children
  if(props.schemaType.name === 'image'){
    // TODO: Christian - the custom components passed down from the schema are not being rendered when passed down like this
    // if(props.schemaType.components?.block) return props.schemaType.components.block
    return <ImageBlock {...props} />
  }
  if(props.schemaType.name === 'block') return <div style={{padding: '0.25rem 0'}}>{props.children}</div>
  return <DefaultCustomBlock {...props} />
}
