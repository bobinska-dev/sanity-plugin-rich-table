import {defineArrayMember, defineType} from 'sanity'

type ArrayMember = ReturnType<typeof defineArrayMember>

export const defaultBlockMember = defineArrayMember({
  type: 'block',
})

export function createContentMembers(
  additionalMembers?: ArrayMember[],
  blockOverrides?: Record<string, unknown>,
): ArrayMember[] {
  const blockMember = blockOverrides
    ? defineArrayMember({...defaultBlockMember, ...blockOverrides, type: 'block'})
    : defaultBlockMember
  return [blockMember, ...(additionalMembers ?? [])]
}
