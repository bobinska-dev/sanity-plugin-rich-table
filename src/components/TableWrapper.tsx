import {ComponentType} from 'react'
import {ObjectInputProps, OperationsAPI} from 'sanity'

import {getPluginConfig} from '../config'
import {RichTableType} from '../schemas/richTable.object'
import Table from './Table'
import TableV2 from './TableV2'

type TableWrapperProps = ObjectInputProps<RichTableType> & {
  handleOpen?: () => void
  isInDialog?: boolean
  isInPortableText?: boolean
  patch: OperationsAPI['patch']
  id?: string
}

/**
 * Table wrapper that selects between original and experimental implementations
 * based on plugin config.
 */
const TableWrapper: ComponentType<TableWrapperProps> = (props) => {
  const {experimentalPortableTextCell} = getPluginConfig()

  if (experimentalPortableTextCell) {
    return <TableV2 {...props} />
  }

  return <Table {...props} />
}

export default TableWrapper
