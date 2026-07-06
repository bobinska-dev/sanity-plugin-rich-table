import {UploadIcon} from '@sanity/icons'
import {useCallback, useMemo} from 'react'
import {
  defineDocumentFieldAction,
  type DocumentFieldActionItem,
  isIndexSegment,
  isKeySegment,
  pathToString,
} from 'sanity'

import {useTableImportRegistry} from './TableImportContext'

/** Schema type names the import field action attaches to. */
const APPLICABLE_TYPE_NAMES = new Set(['richTable', 'richTableBlock'])

/**
 * Document field action adding an "Import table" entry to the field-actions
 * menu (the field header "⋮") of rich-table **object fields**. Array items and
 * Portable Text blocks have no field-actions menu, so `RichTableInput` shows an
 * inline import button for those instead — this action stays hidden there to
 * avoid a redundant, non-functional entry.
 *
 * Because a field action is a menu descriptor with no render slot, it opens the
 * dialog rendered by `RichTableInput` via the {@link TableImportProvider}
 * registry, keyed by the field's path.
 *
 * The returned item and its `onAction` are memoized: `useAction` runs on every
 * field render, and returning a fresh object each time drives Sanity's
 * field-action machinery into a render-phase update loop ("Too many re-renders").
 */
export const tableImportFieldAction = defineDocumentFieldAction({
  name: 'rich-table/import',
  useAction({path, schemaType}) {
    const registry = useTableImportRegistry()
    const key = pathToString(path)

    const lastSegment = path[path.length - 1]
    const isArrayMember = isKeySegment(lastSegment) || isIndexSegment(lastSegment)
    const hidden = !APPLICABLE_TYPE_NAMES.has(schemaType.name) || isArrayMember

    const onAction = useCallback(() => {
      registry?.trigger(key)
    }, [registry, key])

    return useMemo(
      (): DocumentFieldActionItem => ({
        type: 'action',
        icon: UploadIcon,
        title: 'Import table',
        hidden,
        onAction,
      }),
      [hidden, onAction],
    )
  },
})
