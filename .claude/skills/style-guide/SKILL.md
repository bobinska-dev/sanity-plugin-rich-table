---
name: style-guide
description: >
  Sanity's house style rules based on AP Stylebook with company overrides. Covers capitalization, numbers, punctuation, hyphens, abbreviations, dates, code formatting, and US English spelling. Use when writing, editing, or reviewing any content. Triggers on copy editing, style checking, proofreading, and content review. Layers under authentic-content (voice) and sanity-messaging (positioning) to handle mechanical consistency.
---

# Style Guide

Sanity's house style for all written content. Based on AP Stylebook with
company-specific overrides. Apply these rules when writing, editing, or
reviewing any content: blog posts, documentation, social media, internal
communications, marketing copy, and code-adjacent prose.

This skill is mechanical, not creative. It covers the rules that should be
consistent everywhere. For voice, tone, and anti-slop principles, use the
authentic-content skill. For brand messaging and positioning, use
sanity-messaging. This skill layers underneath both.

---

## When This Skill Activates

Use this style guide when:

- Writing or editing any content for Sanity
- Reviewing drafts for consistency
- Checking capitalization, numbers, punctuation, or formatting
- Someone asks for a "style check" or "copy edit"
- Preparing content for publication (blog, docs, social, email)

Load alongside authentic-content and sanity-messaging for review tasks.
This skill handles mechanics; those handle voice and substance.

---

## Sanity Overrides (These Beat AP)

We follow AP Stylebook as our base, with these explicit overrides:

### Oxford Comma: Always Use It

AP says no serial comma. We say yes. Always.

- ✅ "Schemas define structure, relationships, and validation rules."
- ❌ "Schemas define structure, relationships and validation rules."

### Em Dashes: Don't Use Them

AP allows em dashes with spaces. We don't use em dashes at all. Replace
with commas, periods, parentheses, or restructure the sentence.

- ✅ "The system is fast (under 50ms for most queries)."
- ✅ "The system is fast. Under 50ms for most queries."
- ❌ "The system is fast — under 50ms for most queries."

### Headings: Sentence Case

Use sentence case for all headings and subheadings. Capitalize only the
first word and proper nouns.

- ✅ "How to build a content model"
- ✅ "Getting started with GROQ"
- ❌ "How to Build a Content Model"
- ❌ "Getting Started With GROQ"

### Language: US English

Use American English spelling throughout.

- ✅ color, organize, analyze, center, license, catalog
- ❌ colour, organise, analyse, centre, licence, catalogue

---

## Numbers

Follow AP style:

- **Spell out one through nine.** Use figures for 10 and above.
  - "We support three content types and 14 field types."
- **Always use figures for:** ages, percentages, money, dates, times,
  dimensions, and technical measurements.
  - "a 5% increase," "$8 million," "3 seconds," "2 CPU cores"
- **Never start a sentence with a figure** (except years). Rephrase or
  spell it out.
  - ✅ "Twelve users reported the issue." or "The issue affected 12 users."
  - ❌ "12 users reported the issue." (at start of sentence)
- **Percentages:** use the % symbol with figures. "5%" not "five percent."
- **Large numbers:** spell out million, billion, trillion. "$8 million"
  not "$8,000,000."
- **Decades:** no apostrophe. "the 2020s" not "the 2020's."

---

## Capitalization

### Product Names (Always Capitalize)

- Content Lake
- Sanity Studio (or "the Studio" when context is clear)
- GROQ
- Content Operating System (never abbreviate to "COS")
- Portable Text Editor (PTE — introduce abbreviation on first use)
- Presentation Tool

### Trim Redundant "Sanity"

When already in Sanity context:

- ✅ "The Studio is fully customizable with plugins and themes."
- ❌ "Sanity Studio is fully customizable with Sanity plugins and Sanity themes."

### Job Titles

Capitalize before a name, lowercase after or standalone:

- ✅ "VP of Engineering David Annez" / "David Annez, VP of engineering"
- ❌ "The VP Of Engineering said..."

### Technology Terms

- AI (acceptable on first reference for artificial intelligence)
- email (one word, no hyphen)
- internet (lowercase)
- website (one word, lowercase)
- ecommerce (one word, no hyphen)
- open source (noun), open-source (adjective before noun)
- real time (noun), real-time (adjective before noun)

---

## Punctuation

### Commas

- Oxford comma: always (see overrides above)
- Commas and periods go inside quotation marks
- Use a comma after introductory clauses

### Apostrophes

- Plural acronyms: no apostrophe. "APIs" not "API's." "URLs" not "URL's."
- Possessive: add 's even after s. "James's" not "James'."
- Decades: no apostrophe. "1990s" not "1990's."

### Quotation Marks

- Use double quotes for direct quotations and titles of works
- Use single quotes only for quotes within quotes
- Titles of books, articles, songs, talks: use quotation marks, not italics
  (AP style — but in markdown/web contexts where formatting is available,
  italics are acceptable for book titles)

### Hyphens

- Compound modifiers before a noun: hyphenate. "real-time updates,"
  "open-source project," "well-known pattern."
- Compound modifiers after a noun: no hyphen. "The updates are real time."
  "The project is open source."
- Don't hyphenate adverb + adjective compounds with -ly. "newly created
  document" not "newly-created document."

---

## Abbreviations and Acronyms

- Spell out on first use, then abbreviate. "Portable Text Editor (PTE)"
  then "PTE" thereafter.
- Well-known acronyms (API, URL, HTML, CSS, JSON, AI) don't need
  spelling out.
- CMS plural: "CMSes" not "CMS's" or "CMSs."
- Don't create acronyms the reader won't use again. If you only mention
  something once, just use the full name.

---

## Dates and Times

- Abbreviate months with dates: "Feb. 27, 2026" but "February 2026"
  (no abbreviation without a specific date).
- Never abbreviate March, April, May, June, July.
- No ordinals on dates: "Feb. 27" not "Feb. 27th."
- Times: use figures with a.m./p.m. (lowercase, with periods). Spell out
  "noon" and "midnight." Don't use :00. "3 p.m." not "3:00 p.m."
- Comma after year in full dates mid-sentence: "On Feb. 27, 2026, we
  shipped the update."

---

## Code in Content

When content includes code examples, code references, or technical
identifiers:

### Code Block Language Tags

Always specify the language on fenced code blocks. Never use bare
triple backticks.

- ✅ ` ```typescript `
- ✅ ` ```groq `
- ✅ ` ```json `
- ✅ ` ```bash `
- ❌ ` ``` ` (bare, no language)

### apiVersion in Sanity Code Examples

Use a recent, realistic date string. Don't use obviously stale dates.

- ✅ `apiVersion: '2026-02-27'` (current or recent date)
- ❌ `apiVersion: '2021-06-07'` (years out of date)
- ❌ `apiVersion: 'v2021-06-07'` (no 'v' prefix)

### Code Examples Must Work

Use real, tested code that developers can copy and run. Pseudo-code is
acceptable only when clearly labeled as such. If a code example requires
dependencies, mention them.

### Inline Code

Use backtick formatting for:

- Function names: `defineField()`, `useClient()`
- File paths: `sanity.config.ts`
- Package names: `sanity-plugin-markdown`
- CLI commands: `npx sanity dev`
- Field names, type names, and other identifiers: `_type`, `skillName`

Don't use backticks for product names (Content Lake, GROQ, Sanity Studio)
unless referring to them as code identifiers.

---

## Lists

- Use numbered lists for sequential steps or ranked items.
- Use bullet lists for unordered items.
- Keep list items parallel in structure (all start with verbs, or all
  are noun phrases — don't mix).
- Capitalize first word of each item.
- End punctuation: Period if complete sentence or has a verb; none for single words, code-only, or no verb. However, if any item in the list ends in a period, all should end in a period.
- Minimum 2 items (1 item isn't a list).
- Don't end with "etc." or "and so on". Make introduction clear about non-exhaustiveness.
- Separators: If a list item includes a word or phrase followed by a sentence, separate with a colon (:), not a dash or emdash. Example: “Actions: Perform new actions.”

---

## Reference Files

Load these for specific contexts:

- `references/common-mistakes.md` — The most frequent style errors we
  catch in review, with corrections. Quick-reference for copy editing.
