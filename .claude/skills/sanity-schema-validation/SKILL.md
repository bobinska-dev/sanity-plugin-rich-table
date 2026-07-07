---
name: sanity-schema-validation
description: >-
  Sanity schema validation patterns for warning vs error severity, chaining
  Rule methods, and custom validation functions. Use when writing or reviewing
  defineField validation rules, adding warnings to Sanity schemas, or
  debugging validation messages that render at the wrong severity level.
---

# Sanity schema validation

## Severity levels

Sanity validation supports three severity levels. Set severity by **chaining the
level method before `.custom()`**, not by returning an object with a `level`
property.

| Level           | Method chain                                 | Renders as                   |
| --------------- | -------------------------------------------- | ---------------------------- |
| Error (default) | `Rule.custom(…)` or `Rule.error().custom(…)` | Red banner, blocks publish   |
| Warning         | `Rule.warning().custom(…)`                   | Yellow banner, advisory only |
| Info            | `Rule.info().custom(…)`                      | Blue banner, informational   |

## Setting severity correctly

```typescript
// GOOD — warning severity via method chain
validation: (Rule) =>
  Rule.warning().custom((value) => {
    if (!value) return 'Consider adding a value.'
    return true
  })

// BAD — returns { level } object; renders as ERROR in Studio
validation: (Rule) =>
  Rule.custom((value) => {
    if (!value) {
      return { message: 'Consider adding a value.', level: 'warning' } as any
    }
    return true
  })
```

The `{ message, level }` return shape from `.custom()` is not reliably
honoured by the Studio UI. Always use the method chain instead.

## Combining severities on one field

Use an array of rules when a field needs both errors and warnings:

```typescript
validation: (Rule) => [
  Rule.required().error('This field is required.'),
  Rule.warning().custom((value) => {
    if (typeof value === 'string' && value.length > 200) {
      return 'This is quite long — consider shortening.'
    }
    return true
  }),
]
```

## Built-in rule methods and severity

Built-in methods like `.required()`, `.min()`, `.max()`, `.regex()` default to
error severity. Chain `.warning()` or `.info()` **before** the method to change:

```typescript
// Error: hard requirement
Rule.required().error('Title is required.')

// Warning: soft guidance
Rule.warning().min(1, 'Consider adding at least one item.')

// Works with any built-in method
Rule.warning().max(500, 'Descriptions over 500 characters may be truncated.')
```

## Custom validation return values

A `.custom()` function must return one of:

| Return                                | Meaning                             |
| ------------------------------------- | ----------------------------------- |
| `true`                                | Valid                               |
| `string`                              | Invalid — the string is the message |
| `{ message: string; paths?: Path[] }` | Invalid with field-level targeting  |

Never return `false`, `undefined`, or an object with a `level` property.

## Common patterns in this repo

### Checkpoint warnings on plan/template `todos` arrays

```typescript
validation: (Rule) =>
  Rule.warning().custom((todos: any[] | undefined) => {
    if (!todos || todos.length === 0) return true
    const hasCheckpoint = todos.some((t) => t.isCheckpoint)
    if (!hasCheckpoint) {
      return 'No checkpoints — todos will appear in a single ungrouped list.'
    }
    return true
  })
```

### Dual-assignment warning on todo `assignedRole`

```typescript
validation: (Rule) =>
  Rule.warning().custom((value, context) => {
    const { assignedPerson } = (context.parent as any) ?? {}
    if (value && assignedPerson?._ref) {
      return 'Both role and person are set — the person will take precedence.'
    }
    return true
  })
```
