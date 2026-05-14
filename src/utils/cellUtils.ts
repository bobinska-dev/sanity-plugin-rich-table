import {
  ArrayOfObjectsItemMember,
  FieldMember,
  ObjectArrayFormNode,
  ObjectMember,
  Path,
} from 'sanity'

import type {RichTableRowType} from '../schemas/row.object'

interface RowWithCellMembers {
  rowMember: ArrayOfObjectsItemMember<ObjectArrayFormNode<RichTableRowType>>
  cellMembers:
    | {
        item: {
          members: ObjectMember[]
        }
      }[]
    | undefined
}

/**
 * Get the content field member for a specific cell in the table.
 * This is used to pass the correct member to PortableTextCell for rendering.
 */
export function getCellMember(
  rowMembersWithCellMembers: RowWithCellMembers[] | undefined,
  rowIndex: number,
  cellIndex: number,
): FieldMember | undefined {
  const row = rowMembersWithCellMembers?.[rowIndex]
  if (!row) return undefined
  const cellMember = row.cellMembers?.[cellIndex]
  if (!cellMember) return undefined
  const cellItem = cellMember.item
  return (cellItem.members as ObjectMember[])?.find(
    (m): m is FieldMember => m.kind === 'field' && m.name === 'content',
  )
}

/**
 * Get the base path for a cell (without 'content' suffix).
 * Used for path rewriting in the PortableTextCell component.
 */
export function getCellBasePath(member: FieldMember | undefined): Path {
  return member?.field?.path?.slice(0, -1) ?? []
}
