import {defineType, ObjectInputProps} from 'sanity'

import RichTableBock from '../components/RichTableBock'
import RichTableInput from '../components/RichTableInput'
import type {RichTableType} from '../schemas/richTable.object'

function RichTableBlockInput(props: ObjectInputProps) {
  // The block's input receives a generic ObjectInputProps; narrow the value to
  // the rich-table shape RichTableInput expects (this member is a `richTable`).
  return <RichTableInput {...(props as ObjectInputProps<RichTableType>)} isInPortableText />
}

export default defineType({
  name: 'richTableBlock',
  title: 'Rich Table Block',
  type: 'richTable',
  components: {
    block: RichTableBock,
    input: RichTableBlockInput,
  },
})
