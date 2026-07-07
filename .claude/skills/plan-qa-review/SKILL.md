---
name: plan-qa-review
description: >-
  QA review checklist for plans created or edited in Cursor's plan mode. Covers
  assumption documentation (especially context-specific assumptions like SDK
  apps vs plain React, data-fetching primitives, framework specifics), risk
  identification, failure modes, reversibility, and scope boundary clarity.
  Use after creating or editing any *.plan.md file in .cursor/plans/ (project
  or user). The companion postToolUse hook auto-fires this skill on plan file
  writes.
---

# Plan QA review

Apply this skill every time you create or modify a plan file
(`*.plan.md`), whether in a project's `.cursor/plans/` or the user-level
`~/.cursor/plans/` directory. The goal is to catch design and scoping issues
**before** implementation starts, when correction is cheap.

## When to run

- Immediately after writing or editing a `*.plan.md` file.
- When the user explicitly says "QA the plan" or "review the plan".
- The companion `postToolUse` hook (`~/.cursor/hooks/qa-plan-edit.sh`) will
  auto-inject a reminder when a plan file is edited. That reminder is your
  trigger — do not wait to be asked again.

## Review modes

Two modes are supported. **Default to inline.**

- **Inline (default)**: Run the review in your current turn, immediately
  after the plan edit. Fast, single pass, output appended to the chat.
- **Subagent**: Spawn a `generalPurpose` subagent in `readonly: true` mode
  with the plan file path and this skill, asking for an independent QA
  pass. Use only when:
  - the user explicitly asks for an independent or "second opinion" review,
  - the plan is unusually large (≳ 300 lines or many sections), or
  - the plan touches multiple apps / packages / domains and benefits from
    isolated context.

If unsure which mode to use, default to inline and offer the user the
subagent option as a follow-up: _"Want me to also run an independent QA
pass in a subagent?"_

## Review approach

1. **Read the full plan** before commenting. Do not review section-by-section
   in isolation — scope and assumption issues only become visible across
   sections.
2. **Adopt a skeptical QA mindset.** Your job is to find what's missing,
   ambiguous, or wrong — not to validate the existing direction. A review
   with zero findings on a non-trivial plan is suspicious; look harder.
3. **Use severity labels** consistent with the `qa-review-checklist` skill:
   - `[Blocker]` — would cause incorrect implementation, data loss, wasted
     effort, or rework if shipped as-is.
   - `[Should fix]` — ambiguity, missing assumption, scope creep risk,
     unclear acceptance criterion.
   - `[Suggestion]` — clarity, structure, naming, optional improvements.
4. **End with a verdict line**: `Ready to implement` /
   `Needs revision` / `Block — major gaps`.

## The three plan-specific checks

### 1. Assumptions are explicit, named, and context-aware

The single most common plan defect is **unstated assumptions**, especially
when the plan touches code that has framework- or app-specific patterns.
For every assumption, it must be **named**, **justified**, and
**falsifiable** ("how would I prove this wrong?").

Watch for these implicit context assumptions — flag them as `[Should fix]`
or `[Blocker]` if missing:

- **App type**: Is this an SDK app (`sdk-apps/*`), a Studio
  (`studios/*`), a Sanity Function (`functions/*`), shared UI
  (`packages/ui`), or something else? The right answer changes everything
  downstream.
  - **SDK apps** use `@sanity/sdk-react` hooks (`useDocuments`, `useQuery`,
    `useDocument`, `useDocumentProjection`, `useEditDocument`,
    `useApplyDocumentActions`). They are **not** plain React apps and must
    not use `useEffect` + `client.fetch` patterns.
  - **Studios** use the Studio React tree, `useClient`, structure builder
    callbacks, `useFormValue`, document actions, and `@sanity/ui`
    components.
  - **Functions** run server-side, have no React, and use the server
    `@sanity/client`.
  - A "plain React app" pattern (`useEffect` + `fetch` + `useState`) is
    almost always wrong in this monorepo.
- **Data fetching primitive**: Has the plan named the **specific** primitive
  for the context (e.g. `useDocuments` from `@sanity/sdk-react` vs
  `useClient().fetch` in Studio vs server `client.fetch` in a function)?
  Plans that say "fetch the data" without naming the primitive almost
  always pick the wrong one in implementation.
- **Document IDs**: Does the plan distinguish published vs draft
  (`drafts.` prefix)? See the `sanity-document-ids` rule.
- **Schema / types source of truth**: Does the plan reference generated
  `sanity.types.ts` types, or does it invent ad-hoc interfaces? See
  `prefer-generated-sanity-types` and `prefer-sanity-types`.
- **Environment variables**: SDK apps use the `SANITY_APP_*` prefix;
  Studios use `SANITY_STUDIO_*`. See `env-var-naming`. A plan that lists
  env vars with the wrong prefix will fail at build time.
- **Shared UI**: Should new components live in `packages/ui` (`@os-apps/ui`)
  for cross-app reuse, or local to the app? See `shared-ui-library`.
- **GROQ performance**: For any non-trivial query, has the plan considered
  list vs detail projection weight, dereferences, and pagination? See
  `high-performance-groq`.
- **External dependencies**: Are package names, install commands, and
  versions stated (or explicitly deferred to implementation)?
- **Auth / dataset / role**: Whose token? Which dataset (production /
  staging / per-app)? What role / permissions are required?
- **Locale / i18n**: If the plan touches user-facing copy, is the
  localization story addressed (or explicitly deferred)?

For each assumption listed in the plan, ask: _"How would I prove this
wrong?"_ If there's no falsification path, it's not an assumption — it's
a guess masquerading as one. Flag it.

### 2. Risks, unknowns, and failure modes

- **Risks section present** with at least 2-3 entries for any non-trivial
  plan. A plan with zero risks is a plan that hasn't been thought through.
- **Each risk has a mitigation** or an explicit "accept and monitor".
- **Unknowns are listed separately from risks.** Unknowns require
  investigation _before_ implementation; risks are accepted trade-offs.
- **Failure modes named** for each external interaction (network call,
  Sanity API, third-party service, user input, race conditions). Plans
  must not assume the happy path.
- **Reversibility**: If the change is hard to undo (schema rename, content
  migration, public API change, env-var rename, dataset import), the plan
  must say so and propose a rollback path. Field renames in particular
  must reference the eight-layer checklist from `qa-review-checklist`.
- **Blast radius**: Which apps / users / datasets are affected if this
  goes wrong?

### 3. Scope boundaries are clear

- **In scope** and **out of scope** sections are both present and specific.
  "Out of scope" is often the more valuable section — it prevents silent
  scope creep during implementation.
- **No silent multi-app expansion**: If the plan touches more than one app,
  package, or domain, that should be a top-level concern, not buried in
  step 7 of section 4. Cross-cutting changes need extra coordination.
- **Adjacent work named but deferred**: Things that are tempting to fold in
  but should not be — list them and explain why they're deferred (so the
  next person doesn't reopen the debate).
- **Acceptance criteria are concrete and observable**: "Renders X for
  query Y", "calls mutation Z exactly once per save", "returns 200 for
  valid input, 422 with field-level errors for invalid". Avoid vague
  criteria like "works correctly" or "looks good".
- **Milestones with verification steps**: For multi-step plans, each
  milestone should have a way to verify it independently before moving on.

## Output format

Structure your review exactly like this so it's easy to scan:

```
## QA review: <plan title>

**Verdict**: <Ready to implement | Needs revision | Block — major gaps>

### Blockers
- [Blocker] <finding> — <why it matters> — <suggested fix>

### Should fix
- [Should fix] <finding> — <suggested fix>

### Suggestions
- [Suggestion] <finding>

### Strengths
- <one or two specific things the plan got right>
```

If the plan is in good shape, say so explicitly and still list the
strengths. Reinforcing what worked is part of the review.

## Anti-patterns to avoid in your review

- **Restating the plan back to the user** instead of critiquing it.
- **Vague findings** like "consider edge cases" without naming the
  specific case.
- **Style nits as Blockers**. Severity inflation erodes trust in the
  labels.
- **Missing the strengths section.** Even thin plans usually got _something_
  right; name it.

## Cross-references

- `qa-review-checklist` — the general code/types/GROQ/a11y checklist
  applied during implementation. Plan QA is the upstream equivalent;
  many of the same concerns (type safety, async error handling, field
  rename completeness) should be anticipated at plan time.
- `content-modeling-best-practices` — for plans involving schema design.
- `high-performance-groq` — for plans involving non-trivial queries.
- `sanity-app-sdk` — for SDK app data-fetching primitives.
- `os-apps-ui` — for plans that may belong in shared UI.
- `env-var-naming` — for plans introducing new environment variables.
