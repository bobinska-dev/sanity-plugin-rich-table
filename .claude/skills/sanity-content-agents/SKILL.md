---
name: sanity-content-agents
description: >-
  Build content agents on top of Sanity Agent Actions (Generate, Transform,
  Translate, Prompt, Patch). Covers when to use each action, the
  `instructionParams` shapes (`constant` / `field` / `document` / `groq`), the
  two-phase noWrite→write pattern for editor-in-the-loop ingest with
  clarifications, schema-deploy + embeddings-index prerequisites for
  reference-aware generation, AI Assist custom field actions for in-Studio
  refinement, and the `@sanity/agent-context` plugin for read-side scoped MCP
  endpoints. Use when designing or implementing any flow that reads or writes
  Sanity content via `client.agent.action.*`, that wires `@sanity/assist`
  custom field actions, that bootstraps editor-curated context (e.g. a
  voice/conventions singleton), or that exposes a read-only MCP for external
  agents.
---

# Sanity content agents

Build editor-in-the-loop content agents that read source material, draft
structured Sanity content, ask the editor for missing details, and commit a
schema-valid document. This skill covers the full toolkit and the patterns
that scale to complex content models.

## When to use which Action

| Action | What it does | Typical use |
|---|---|---|
| `client.agent.action.generate` | Schema-aware **additive** writes. Creates a doc or appends to existing arrays. | Importing a new template, appending todos to an existing plan, drafting a section. |
| `client.agent.action.transform` | Rewrites existing field content in place (tone, length, language, format). | "Tighten this title", "rewrite into bullets", "expand this PT block." |
| `client.agent.action.translate` | Locale-aware translation of fields into other languages. | Multi-locale content fan-out. |
| `client.agent.action.prompt` | Free-form LLM call returning a string. **Not** schema-aware. | Generating a non-content artefact (e.g. a slug, a summary used elsewhere). |
| `client.agent.action.patch` | Server-side mutate(). No LLM. | Programmatic post-processing after one of the above (e.g. setting status, copying provenance). |

**Generate is additive only.** It can append to arrays and fill empty fields,
but it cannot rewrite or delete what's already there. For destructive merges
you need a Transform-based flow plus an explicit conflict-resolution UX.

## `instructionParams` shapes

`instructionParams` interpolate typed values into the `instruction` string at
positions like `$placeholder`. Always pass dynamic data through
`instructionParams` — never string-concat into the instruction (it breaks
prompt injection guardrails).

```ts
await client.agent.action.generate({
  schemaId: process.env.SANITY_AGENT_SCHEMA_ID!,
  targetDocument: { operation: 'create', _type: 'planTemplate' },
  instruction: `Use $editorialGuide as the voice. Source text in $sourceText.
                Refer to $existingTemplates for similar items.`,
  instructionParams: {
    // Inline literal — number, string, anything serialisable.
    sourceText: { type: 'constant', value: extractedText },

    // Whole document fetched at run-time. Agent reads the published version.
    editorialGuide: { type: 'document', documentId: 'coachEditorialGuide' },

    // Specific field on a document.
    notes: {
      type: 'field',
      documentId: planImportId,
      path: 'clarifications',
    },

    // GROQ result. Use $params for parameterised filters.
    existingTemplates: {
      type: 'groq',
      query: '*[_type == "planTemplate" && _id in $candidateIds]{ _id, title, role }',
      params: { candidateIds },
    },
  },
})
```

## Two-phase noWrite → write pattern (editor-in-the-loop)

The standard pattern when you need the editor to fill gaps before committing:

1. **Phase 1 (draft)** — call Generate with `noWrite: true`. The agent returns
   a draft document but **nothing is persisted**. Diff the draft against your
   required-field checklist and emit a `clarifications[]` array of structured
   questions (`{ question, choices?, askedAt }`).
2. **Editor reviews** — render the draft side-by-side with the source and the
   clarifications. The editor answers the questions in the UI.
3. **Phase 2 (commit)** — call Generate again with `noWrite: false`. Pass the
   answered clarifications via an `instructionParams` of `type: 'field'`
   pointing at the in-flight ingest doc, so the agent has the editor's
   answers as context. For update intents, constrain `target.include` to the
   additive fields (e.g. `['todos', 'stakeholders']`) so the agent doesn't
   touch header fields.

Persist the conversation buffer as a dedicated document type (e.g.
`planImport`) with `status` (`received` → `analysing` → `awaiting_input` →
`generating` → `committed` | `failed`), `source` (the input), `agentDraft`
(the noWrite result), `clarifications`, and `producedDocument` (the
reference once committed). This:

- Lets two surfaces (Studio tool + SDK app) share the same lifecycle.
- Gives you replayable audit trails ("how was this template created?").
- Makes the function **status-driven and idempotent** — the blueprint filter
  matches on `status in [...]`, so a self-trigger after a status change is a
  free no-op.

**`target.include` / `target.exclude` are scope hints**, not enforcement.
Combine them with a forbidden-field guard in your handler that asserts the
diff stays inside the allowed paths and refuses to commit otherwise.

## Pre-requisites that bite if you skip them

1. **Schema deploy** — Agent Actions resolve fields and types from the
   **deployed** schema id, not the local one. Run `pnpm sanity schema deploy`
   any time you change a schema that the agent writes. Capture the schema id
   in env (e.g. `SANITY_AGENT_SCHEMA_ID_<DATASET>`).
2. **Embeddings index** for reference fields — Generate cannot wire
   `someField._ref` to an existing document unless an `aiAssist.embeddingsIndex`
   is configured on the reference. Create the index (`sanity embeddings-index
   create my-index --query '*[_type in [...]]'`) **and** wire the index
   name on the reference field's `options.aiAssist.embeddingsIndex`. The
   index is reversible — `sanity embeddings-index delete my-index`.
3. **Read/write token** with the right grants. For server-side functions,
   provision a dedicated token (not the editor's) scoped to the minimum
   document types you write. Pre-flight check the editor's actual ACL before
   committing on their behalf.

## Limitations to design around

- **File-type fields and image/file uploads** are not generated. Hand-create
  the asset and let Generate fill in metadata.
- **Hidden / readOnly fields** are skipped. If a field's visibility depends
  on a sibling, pass the conditional state via `conditionalPaths`.
- **Date/datetime fields** need `localeSettings` to resolve relative dates.
- **PT annotations and inline blocks** are not generated by default — keep
  PT blocks simple in the v1 instruction.
- **Generate is additive.** Re-running it on the same target appends; it
  does not deduplicate. Encode dedup in the instruction or handle it
  post-commit.
- The deployed schema is the source of truth for the LLM. Forgetting `schema
  deploy` is the #1 cause of "the agent isn't using my new field".

## Three context layers for complex content models

When the content model has more than ~10 document types, the schema alone
isn't enough context — the agent needs domain vocabulary and house style.
Layer three sources, each editor-tunable without code changes:

### Layer A — Editorial guide singleton

A true one-per-dataset singleton with a fixed `_id` (per the
`clarify-singletons-vs-scoped-documents` rule) holding rules the agent
follows but that don't belong in the schema. Typical fields:

- `voice` (PT) — tone, point of view, do/don't list.
- `<domain>Conventions` (PT) — domain-specific rules (e.g.
  `checkpointConventions` for plan templates).
- `<domain>Taxonomy` / `normalisation` (array of `{ aliases, canonical }`) —
  mapping external vocabulary to the canonical values used in the schema.
  **Keep different concepts as separate fields**, even if they look similar
  on the surface (e.g. job titles vs stakeholder relationship roles).
- `forbiddenTopics` (text) — things the agent must never put into a
  published document.

Pass it to **every** Agent Actions call as
`instructionParams: { editorialGuide: { type: 'document', documentId: '<singletonId>' } }`.
The agent reads the **published** version — drafts in progress don't change
agent behaviour mid-edit. Pin the singleton in the structure builder under
"Settings → Editorial guide for AI" so editors know where to find it.

### Layer B — AI Assist custom field actions

`@sanity/assist` lets you register `defineAssistFieldAction(...)` actions
that appear in the editor's AI menu on specific fields. Use them for
in-Studio refinement that complements your bulk-import flow:

```ts
import { assist, defineAssistFieldAction } from '@sanity/assist'
import { useUserInput } from '@sanity/assist'

assist({
  fieldActions: {
    title: 'My Domain AI',
    useFieldActions: ({ actionType, schemaId, documentIdForAction, path, schemaType, getConditionalPaths }) => {
      const client = useClient({ apiVersion: '2026-03-01' })
      const getUserInput = useUserInput()
      return useMemo(() => {
        if (actionType !== 'field' || schemaType?.name !== 'todo') return []
        return [
          defineAssistFieldAction({
            title: 'Tighten title',
            onAction: async () => {
              await client.agent.action.transform({
                schemaId,
                documentId: documentIdForAction,
                instruction: 'Rewrite this title in $editorialGuide voice.',
                instructionParams: {
                  editorialGuide: { type: 'document', documentId: 'editorialGuide' },
                },
                target: { path },
              })
            },
          }),
        ]
      }, [/* deps */])
    },
  },
})
```

**Reuse the same instruction builders** between your bulk-ingest function
and these field actions so behaviour stays consistent. Keep the builders in
a shared file (e.g. `functions/lib/runImportAgent.ts`) and import them from
the Studio plugin.

**Blast radius**: registered actions appear in **every** editor's AI menu,
not just the ingest users'. Mitigate with:

- An env toggle (`process.env.SANITY_STUDIO_<APP>_AI_ACTIONS === 'enabled'`)
  around the registration so they can be turned off project-wide without a
  redeploy.
- Staging-first rollout with a one-click smoke test per action.

### Layer C — `@sanity/agent-context` (scoped MCP endpoint)

Install `@sanity/agent-context` and register `agentContextPlugin()` in the
Studio. Seed `sanity.agentContext` documents (via a content migration) that
expose a **read-only MCP endpoint** scoped by GROQ:

- **Library context** — `groqFilter: '_type in ["template","tag","resource"]'`,
  `instructions` curated to explain domain vocabulary.
- **Archive context** — `groqFilter: '_type == "<doc>" && status in ["active","completed"]'`,
  for "find similar" UX in external agents.

Each `agentContext` doc publishes `initial_context`, `groq_query`, and
`schema_explorer` MCP tools usable by Cursor, Claude Code, and any future
SDK app chat UX. The MCP is **read-only** — your write path still owns
mutations via Agent Actions. Editors can tune scope and instructions
without code.

## Pairing with workspace conventions

- **Blueprint filters carry preconditions, not the handler.** Push status
  checks, `delta::changedAny()`, and `count(...) > 0` predicates into the
  filter. Handlers that re-fire on their own writes are a free no-op when
  the new status no longer matches.
- **Idempotent handlers.** Compute desired vs current and commit only on
  diff. Keeps self-loops free even when you can't break them at the filter.
- **Sanity keys and ids.** Never hand-roll `_key` from another value. Pass
  `{ autoGenerateArrayKeys: true }` to `client.patch().commit()` /
  `client.create()`. Never set custom `_id`s on produced documents.
- **Singleton clarification.** If your editorial-guide doc is one-per-X (per
  team, per locale, per workspace), it is **not** a singleton — model it as
  a scoped document with a reference + uniqueness constraint.
- **Content migrations.** Use `defineMigration` from `sanity/migrate` to
  bootstrap the editorial guide singleton and the `agentContext` docs;
  never bulk-edit them by hand.
- **Error handling for data fetching.** Every `client.agent.action.*` call
  must end in `.catch()` (or be wrapped in `try/catch`). Surface the LLM
  error in `errorLog` on the in-flight ingest doc and flip its status to
  `failed`. Do **not** silently retry.
- **Agent Actions require `apiVersion: 'vX'`.** The endpoint is only
  served on the experimental `vX` API version. Calling it with a dated
  version returns `Bad Request — Agent Actions are only available on
  apiVersion vX`. Don't bump the whole client to `vX` (other endpoints
  may behave differently on experimental); instead clone narrowly:

  ```ts
  // Function or Studio plugin: keep the stable client for CRUD,
  // clone onto vX only for the agent call.
  const agentClient = client.withConfig({ apiVersion: 'vX' })
  const doc = await agentClient.agent.action.generate({ schemaId, ... })
  ```

  In the Studio, derive `agentClient` once with `useMemo`:

  ```ts
  const client = useClient({ apiVersion: '2026-03-01' })
  const agentClient = useMemo(
    () => client.withConfig({ apiVersion: 'vX' }),
    [client],
  )
  ```

- **Never detach `client.agent.action.*` methods from their receiver.**
  `AgentActionsClient` reads `this.#client` and `this.#httpRequest` as
  private class fields. Hoisting the method into a local —

  ```ts
  // BAD — `this` is undefined at call time
  const generate = client.agent.action.generate
  const doc = await generate({ schemaId, ... })
  // → TypeError: Cannot read properties of undefined (reading '#client')
  ```

  — produces a deeply unhelpful error because the runtime tries to read
  a private field on `undefined`. Always call the method on the receiver:

  ```ts
  // GOOD
  const doc = await client.agent.action.generate({ schemaId, ... })
  ```

  If the request type is generic in a way TypeScript can't infer, narrow
  the response with `as unknown as MyShape` rather than detaching the
  method to escape the type. The same rule applies to `transform`,
  `translate`, `prompt`, and `patch` — they all live on the same class.
- **Generated TypeScript types.** Type the function handler as
  `DocumentEventHandler<MyImportDoc>` against the projection in the
  blueprint, and use the generated `*_QUERY_RESULT` types for any GROQ
  the handler runs.

## Worked example: Coach plan-import

The Coach onboarding-plan importer (`functions/importPlanFromDoc/`) uses
all of the above. It accepts a Google Doc URL or an uploaded `.docx` /
`.pdf` / `.txt` / `.md`, asks the editor to confirm intent and fill in
missing details, then creates a `planTemplate` (or appends todos to an
existing template / plan). Specifically:

- Persistent `planImport` doc as the conversation buffer (status pipeline,
  source text, agent draft, clarifications, produced doc reference,
  `expiresAt` for cleanup).
- Two-phase Generate (`noWrite: true` then `noWrite: false`) with
  `target.include: ['todos','stakeholders']` for update intents, plus a
  forbidden-field guard.
- Embeddings index (`plan-import`) over `todoTemplate` / `checkpointTemplate`
  / `learningModule` / `resource` powers reference resolution **and**
  resource suggestions (Layer D below).
- Editorial guide singleton (`coachEditorialGuide`) with `voice`,
  `checkpointConventions`, `jobRoleNormalisation` (job-title canonicalisation),
  and `stakeholderPlaybooks` (default stakeholder sets per plan type, using
  `STAKEHOLDER_ROLES` strictly for relationships — kept separate from
  job-title taxonomy).
- AI Assist custom field actions ("Fill todos from description", "Propose
  checkpoints", "Suggest stakeholders", "Tighten todo titles", "Generate
  description", "Find resources from description") share instruction
  builders with the import function.
- `@sanity/agent-context` plugin with two seeded contexts (`coach-library`
  and `coach-plans-archive`) for external-agent read access.
- Layer D — **resource suggestion**: URL extraction + named-resource
  heuristic in `extractDocText`, embeddings match against `_type=="resource"`
  with a per-row picker in the Studio tool, additive merge on commit.
- Lifecycle: provenance copy onto produced doc + heavy-field null on commit
  + `expiresAt` set on every transition + nightly GitHub Actions sweeper.
- Safeguards: 80k-char source cap, 10MB upload cap, file-type allow-list,
  Google Docs URL allow-list, prompt-injection delimiter wrapper around
  `sourceText`, per-user concurrency cap, target-document lock + `_rev`
  check, reference confidence threshold, pre-flight permission check,
  stuck-import sweeper, no silent retries, env-toggled AI Assist actions.

See `.cursor/plans/plan_import_content_agent_*.plan.md` (project-local) for
the full design.
