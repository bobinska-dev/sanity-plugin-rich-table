---
name: sanity-scheduled-functions
description: >-
  How to add, configure, and deploy Sanity Scheduled Functions in this repo.
  Scheduled functions run on a cron schedule and live on a separate
  organization-scoped Blueprint stack at `blueprints/scheduled/`, distinct
  from the project-scoped document functions in the root
  `sanity.blueprint.ts`. Covers `defineScheduledFunction`, robot tokens,
  cron expressions / natural-language schedules, the `blueprints promote`
  one-way migration to org scope, the `scheduledEventHandler` runtime,
  local `sanity functions dev`, and the per-stack `blueprints plan` /
  `deploy` workflow. Use when the user asks to schedule a function, run a
  cron job in Sanity, add a periodic / monthly / daily / hourly task, work
  with `blueprints/scheduled/sanity.blueprint.ts`, deploy an org-scoped
  blueprint, or move an existing function from event-triggered to
  scheduled.
---

# Sanity Scheduled Functions

Scheduled (cron) functions in this repo live on a **separate org-scoped Blueprint stack** at `blueprints/scheduled/`, **not** the root `sanity.blueprint.ts`. The two stacks deploy independently and must never be merged — scheduled functions require organization scope, document/event functions stay project-scoped.

## Repo layout

```
sanity.blueprint.ts              ← project-scoped, document/event functions
blueprints/
└── scheduled/
    └── sanity.blueprint.ts      ← org-scoped, scheduled functions only
functions/
├── tsconfig.json                ← shared by BOTH stacks
├── computeNextReviewDue/        ← document function
├── generateMotivationalPhrases/ ← scheduled function
└── …
```

Function source lives in the **shared** `functions/` directory. The org-scoped blueprint references each function via a relative `src` path (e.g. `'../../functions/generateMotivationalPhrases'`) because it is not at the repo root.

## When to use a scheduled function

Reach for a scheduled function when the trigger is **time**, not a document mutation:

- Periodic syncs (Slack users, third-party data) where you can't subscribe to changes.
- Daily/weekly aggregations or report generation.
- Generating fresh content on a cadence (e.g. monthly motivational phrases).
- Cleanup / TTL / archival jobs.

If the trigger is "something happened to a document", use a `defineDocumentFunction` on the root blueprint instead — see the `sanity-functions` rule.

## Adding a new scheduled function

### 1. Doctor and version check (one-time)

From the **org-scoped blueprint directory**:

```bash
cd blueprints/scheduled
pnpm dlx sanity@latest blueprints doctor
```

All checks must be green and the "internals" version must be **14.10.1 or later**. If older, update `@sanity/blueprints` (and `@sanity/functions` if installed) in the **root** `package.json` — both stacks share the repo's dependencies.

### 2. Scaffold the function code

From the **repo root** (so the function lands in the shared `functions/` directory):

```bash
pnpm dlx sanity@latest functions add --type scheduled-function --name <name>
```

> The `scheduled-function` type is currently hidden from the interactive picker; pass `--type scheduled-function` explicitly.

This creates `functions/<name>/index.ts` with a `scheduledEventHandler` template. The handler signature is:

```ts
import { scheduledEventHandler } from '@sanity/functions'

export const handler = scheduledEventHandler(async ({ context }) => {
  // context.projectId, context.dataset, context.clientOptions, context.token
})
```

If the function is moved out of `functions/<name>/`, update `functions/tsconfig.json` `include` accordingly.

**Never use `npx`** in this repo — always `pnpm dlx`. Running `npx` corrupts pnpm's dependency resolution by writing a phantom `package-lock.json`.

### 3. Register in the org-scoped blueprint

Add an entry to `blueprints/scheduled/sanity.blueprint.ts`. Use a **relative `src`** so the org stack can find the source under the shared `functions/` directory:

```ts
import { defineBlueprint, defineScheduledFunction } from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineScheduledFunction({
      name: '<name>',
      src: '../../functions/<name>',
      event: { expression: 'first of the month at noon' },
      timezone: 'America/New_York',
      timeout: 30,
    }),
  ],
})
```

Do **not** add scheduled functions to the root `sanity.blueprint.ts`. That stack is project-scoped and `defineScheduledFunction` will fail to deploy there.

### 4. Specify the schedule

`event` accepts either a cron object or a natural-language `expression`. Pick one — never both.

**Natural-language** (recommended for readability when the cadence is simple):

```ts
event: {
  expression: 'first of the month at noon'
}
event: {
  expression: 'every Monday at 9am'
}
event: {
  expression: 'every 30 minutes'
}
event: {
  expression: 'every day at midnight'
}
```

**Cron** (use when you need precise control or the natural form is ambiguous):

```ts
event: {
  minute: '0',
  hour: '0',
  dayOfWeek: '*',
  month: '*',
  dayOfMonth: '*',
}
```

`timezone` is optional but **strongly recommended** for any business-hours schedule — without it, the schedule runs in UTC and behaviour shifts twice a year as DST changes elsewhere. Use IANA names (`'America/New_York'`, `'Europe/Oslo'`).

### 5. Writing to Sanity → robot token

Scheduled functions do **not** receive an editor's token — `context.token` is for the function's own metadata, not for writing user content. If the handler needs to read or write Sanity documents, define a robot token in the same blueprint and reference it from the function:

```ts
import { defineBlueprint, defineRobotToken, defineScheduledFunction } from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineScheduledFunction({
      name: 'mySchedFn',
      src: '../../functions/mySchedFn',
      event: { expression: 'every day at midnight' },
      timezone: 'America/New_York',
      robotToken: '$.resources.coachWriter.token',
    }),
    defineRobotToken({
      name: 'coachWriter',
      label: 'Coach Writer',
      memberships: [
        {
          resourceType: 'project',
          resourceId: 'r3dzy7he',
          roleNames: ['editor'],
        },
      ],
    }),
  ],
})
```

The handler can then construct a client with that token:

```ts
import { createClient } from '@sanity/client'
import { scheduledEventHandler } from '@sanity/functions'

export const handler = scheduledEventHandler(async ({ context }) => {
  const client = createClient({
    ...context.clientOptions,
    dataset: 'coach',
    apiVersion: '2026-04-01',
    useCdn: false,
  })
  // …
})
```

`context.clientOptions` already includes the robot token when one is referenced via `robotToken` — never log it.

See [Robot tokens with Functions](https://www.sanity.io/docs/functions/robot-tokens-with-functions) for the full reference.

### 6. Test locally

From the **org-scoped blueprint directory** (so the local runner picks up the right `sanity.blueprint.ts`):

```bash
cd blueprints/scheduled
pnpm dlx sanity@latest functions dev
```

`functions dev` starts a local runner that lets you trigger the scheduled function on demand without waiting for the cron. Pass any required env vars (e.g. `MESSAGING_ANTHROPIC_API_KEY`, `SANITY_DATASET`) on the command line or via `.env.local` in the repo root.

### 7. Plan and deploy

Always plan first — a `defineScheduledFunction` mistake won't be caught until deploy:

```bash
cd blueprints/scheduled
pnpm dlx sanity@latest blueprints plan
pnpm dlx sanity@latest blueprints deploy
```

Run **both** commands from `blueprints/scheduled/`. From any other directory the CLI targets the root project-scoped stack and either does nothing or fails because the resource type isn't valid there.

Check function logs:

```bash
pnpm dlx sanity@latest functions logs <name>
```

## One-time stack promotion (already done in this repo)

The org-scoped stack at `blueprints/scheduled/` was created via `sanity blueprints promote`. **This has already happened — do not re-run promote.** Notes for posterity:

- `blueprints promote` is a **one-way** migration from project to organization scope.
- Existing project-scoped resources stay where they are (the root `sanity.blueprint.ts` was untouched).
- Promotion is required because scheduled functions can only be deployed against an org-scoped stack.

If a future fresh-checkout situation requires re-bootstrapping the stack, the recovery path is:

1. `cd blueprints/scheduled`
2. `pnpm dlx sanity@latest blueprints info` — confirm the local blueprint is connected to a live org-scoped stack.
3. If not connected, escalate to a Sanity admin — `promote` requires org-admin permissions and a personal user token.

## Idempotent handlers

Scheduled functions don't have a `delta::changedAny()` filter to lean on — every fire runs the handler. Build idempotency in:

- **Compare-then-write**: fetch current state, compute desired state, only commit on a real diff.
- **Marker fields**: write a `lastRunAt` / fingerprint and skip if the same input would produce the same output.
- **Bounded scope**: filter the input set to only documents that need the operation, e.g. `*[_type == "x" && !defined(processedAt)]`.

Never rely on the cron alone — schedules can fire twice in rare cases (deploy windows, retries), and a non-idempotent handler will produce duplicates.

## Validation pattern (writing user content)

For functions that generate or sync content, validate before writing — bad output is harder to roll back than a missed run:

```ts
if (items.length < MIN_EXPECTED) {
  console.error(`[${name}] Only ${items.length} valid items — skipping write`)
  return
}
await client
  .createOrReplace({
    /* … */
  })
  .catch((err) => {
    console.error(`[${name}] Failed to write:`, err instanceof Error ? err.message : err)
  })
```

`generateMotivationalPhrases` (`functions/generateMotivationalPhrases/index.ts`) is the canonical example in this repo — refusing to write when fewer than 10 phrases survive parsing.

## CI/CD caveat

Org-scoped blueprint stacks currently **cannot be deployed from CI/CD** — `blueprints deploy` against an org stack requires a personal user token, and shipping that token to GitHub Actions is not advisable. Until Sanity ships an org-scoped service token, all `blueprints/scheduled/` deploys must be run manually by a logged-in human. The root project-scoped stack is unaffected and continues to deploy from CI as normal.

## Reference: `defineScheduledFunction` options

| Field        | Required | Notes                                                                                   |
| ------------ | -------- | --------------------------------------------------------------------------------------- |
| `name`       | Yes      | Unique within the stack. Lowercase + dashes preferred.                                  |
| `src`        | Yes      | Relative path from the blueprint to the function source (`'../../functions/<name>'`).   |
| `event`      | Yes      | Either `{ expression: '<natural language>' }` or a cron object (`minute`, `hour`, …).   |
| `timezone`   | No       | IANA name (`'America/New_York'`). Default UTC. Always set for business-hours schedules. |
| `timeout`    | No       | Seconds. Default 10, max 60. Bump for slow LLM calls or large fan-out work.             |
| `robotToken` | No       | Reference string to a `defineRobotToken` resource: `'$.resources.<robotName>.token'`.   |

Source: [`defineScheduledFunction` examples in `blueprints-node`](https://github.com/sanity-io/blueprints-node/blob/main/src/definers/functions.ts#L207-L245).

## Anti-patterns

- ❌ Adding `defineScheduledFunction(...)` to the root `sanity.blueprint.ts`. It will fail at deploy time because the root stack is project-scoped.
- ❌ Running `blueprints deploy` from the repo root expecting it to deploy scheduled functions. Only the org stack at `blueprints/scheduled/` deploys them.
- ❌ Using `npx` instead of `pnpm dlx` — corrupts pnpm's dependency graph by writing a phantom lockfile.
- ❌ Hand-building a Sanity client from `process.env.SANITY_TOKEN` instead of `context.clientOptions` + a `robotToken` reference. The robot-token flow is auditable; ad-hoc env tokens are not.
- ❌ Both `expression` and discrete cron fields on the same `event`. Pick one.
- ❌ Re-running `blueprints promote` — it's one-way and already done for this repo.
- ❌ Logging `context.token` or `context.clientOptions.token`.

## Related

- `sanity-functions` rule (`.cursor/rules/sanity-functions.mdc`) — document/event functions, blueprint filters, idempotency, draft/version events.
- `sanity-cli` skill — general `sanity` CLI flag conventions (project/dataset pairing, dry-run discipline).
- `functions/README.md` — per-function documentation.
- `functions/generateMotivationalPhrases/index.ts` — canonical scheduled-function example using the Anthropic API and `createOrReplace`.
