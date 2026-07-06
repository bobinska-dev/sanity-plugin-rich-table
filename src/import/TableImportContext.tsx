import {createContext, type ReactNode, useContext, useEffect, useMemo, useRef} from 'react'

type OpenImportFn = () => void

interface TableImportRegistry {
  /** Register the "open import dialog" callback for the field at `key` (its path string). */
  register: (key: string, open: OpenImportFn) => void
  /** Remove a previously registered callback. */
  unregister: (key: string) => void
  /**
   * Trigger the import dialog for the field at `key`. Returns `true` when a
   * handler was registered (i.e. the field's input is mounted), else `false`.
   */
  trigger: (key: string) => boolean
}

const TableImportContext = createContext<TableImportRegistry | null>(null)

/**
 * Bridges the rich-table import field action to the dialog rendered by
 * `RichTableInput`.
 *
 * A Sanity field action is a menu descriptor with no render slot, so it cannot
 * open a dialog on its own. This provider (mounted once at the studio layout)
 * keeps a registry of each mounted rich-table input's "open dialog" callback,
 * keyed by field path. The field action looks up the callback for its path and
 * calls it — so the dialog and the (proven) write logic stay in the input.
 */
export function TableImportProvider({children}: {children: ReactNode}) {
  const registry = useRef(new Map<string, OpenImportFn>())

  const value = useMemo<TableImportRegistry>(
    () => ({
      register: (key, open) => {
        registry.current.set(key, open)
      },
      unregister: (key) => {
        registry.current.delete(key)
      },
      trigger: (key) => {
        const open = registry.current.get(key)
        if (!open) return false
        open()
        return true
      },
    }),
    [],
  )

  return <TableImportContext.Provider value={value}>{children}</TableImportContext.Provider>
}

/** Access the import registry. Returns `null` when the provider is not mounted. */
export function useTableImportRegistry(): TableImportRegistry | null {
  return useContext(TableImportContext)
}

/**
 * Registers `open` as the import trigger for the field at `pathKey` for as long
 * as the calling input is mounted. No-op when the provider is absent.
 */
export function useRegisterTableImport(pathKey: string, open: OpenImportFn): void {
  const registry = useTableImportRegistry()
  useEffect(() => {
    if (!registry) return undefined
    registry.register(pathKey, open)
    return () => registry.unregister(pathKey)
  }, [registry, pathKey, open])
}
