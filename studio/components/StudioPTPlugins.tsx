import type {PortableTextPluginsProps} from 'sanity'
import {RichTablePastePlugin} from 'sanity-plugin-rich-table'

/**
 * Dev-studio Portable Text plugins slot. Renders Sanity's default PT plugins,
 * then adds the rich-table paste behavior so pasting a spreadsheet / HTML /
 * markdown table into a document-body PT field inserts a `richTableBlock`.
 */
export default function StudioPTPlugins(props: PortableTextPluginsProps) {
  return (
    <>
      {props.renderDefault(props)}
      <RichTablePastePlugin />
    </>
  )
}
