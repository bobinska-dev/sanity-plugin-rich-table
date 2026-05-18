import {ComponentProps, JSX} from 'react'

import {getPluginConfig} from '../config'
import TableGrid from './TableGrid'
import TableGridV2 from './TableGridV2'

type TableGridProps = ComponentProps<typeof TableGrid>

/**
 * TableGrid wrapper that selects between original and experimental grid
 * based on plugin config.
 */
const TableGridWrapper = (props: TableGridProps): JSX.Element => {
  const {experimentalPortableTextCell} = getPluginConfig()

  if (experimentalPortableTextCell) {
    return <TableGridV2 {...props} />
  }

  return <TableGrid {...props} />
}

export default TableGridWrapper
