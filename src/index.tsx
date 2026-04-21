import {defineArrayMember, definePlugin} from 'sanity'

import {setAdditionalBlockObjects} from './pluginConfig'
import {createCellObject, createCellObjectWithType, RichTableCellType} from './schemas/cell.object'
import columnHeaderObject, {ColumnHeader} from './schemas/columnHeader.object'
import richTableBlock from './schemas/richTable.block'
import richTableObject, {RichTableType} from './schemas/richTable.object'
import rowObject, {RichTableRowType} from './schemas/row.object'

type ArrayMember = ReturnType<typeof defineArrayMember>

export type {RichTableType, RichTableRowType, RichTableCellType, ColumnHeader}

interface RichTablePluginOptions {
  cellContentAdditionalMembers?: ArrayMember[]
  cellContentBlockOverrides?: Record<string, unknown>
  contentTypeName?: string
}

export const richTablePlugin = definePlugin<RichTablePluginOptions>((options) => {
  console.log('[rich-table] richTablePlugin called with options:', options)

  if (options?.cellContentAdditionalMembers?.length) {
    setAdditionalBlockObjects(
      options.cellContentAdditionalMembers.map((member) => {
        const m = member as any
        return {
          name: (m.name ?? m.type) as string,
          title: m.title as string | undefined,
          fields: m?.type?.fields ?? m?.fields ?? [],
        }
      }),
    )
  }

  const cellObject = options?.contentTypeName
    ? createCellObjectWithType(options.contentTypeName)
    : createCellObject(options?.cellContentAdditionalMembers, options?.cellContentBlockOverrides)

  return {
    name: 'rich-table',
    title: 'Rich Table Plugin',
    schema: {
      types: [richTableObject, rowObject, columnHeaderObject, richTableBlock, cellObject],
    },
  }
})
