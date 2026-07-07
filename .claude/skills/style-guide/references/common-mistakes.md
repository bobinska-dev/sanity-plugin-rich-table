# Common Style Mistakes

The errors we catch most often in review. Use this as a quick-reference
checklist when copy editing.

---

## Punctuation

### Missing Oxford comma

- ❌ "We support schemas, queries and mutations."
- ✅ "We support schemas, queries, and mutations."

### Em dash usage

- ❌ "The API is fast — really fast."
- ✅ "The API is fast. Really fast."
- ✅ "The API is fast (really fast)."

### Apostrophe on plural acronyms

- ❌ "Multiple API's are available."
- ✅ "Multiple APIs are available."

### Missing comma after introductory clause

- ❌ "After deploying the update we noticed a regression."
- ✅ "After deploying the update, we noticed a regression."

### Incorrect quotation mark placement

- ❌ "Content Lake", as they call it
- ✅ "Content Lake," as they call it

---

## Capitalization

### Title case in headings (should be sentence case)

- ❌ "How To Build A Content Model With Sanity"
- ✅ "How to build a content model with Sanity"

### Lowercase product names

- ❌ "Store content in the content lake."
- ✅ "Store content in the Content Lake."

### Overcapitalized job titles

- ❌ "Our Head Of Engineering reviewed the PR."
- ✅ "Our head of engineering reviewed the PR."
- ✅ "Head of Engineering Knut Melvær reviewed the PR."

---

## Numbers

### Spelling out numbers 10 and above

- ❌ "We tested twelve configurations."
- ✅ "We tested 12 configurations."

### Using figures for numbers below 10

- ❌ "The schema has 3 fields."
- ✅ "The schema has three fields."
- Exception: technical measurements, ages, percentages always use figures.

### Starting a sentence with a figure

- ❌ "14 users reported the bug."
- ✅ "Fourteen users reported the bug."
- ✅ "The bug was reported by 14 users."

### Decade apostrophes

- ❌ "Popular in the 2020's."
- ✅ "Popular in the 2020s."

---

## Hyphens

### Missing hyphen on compound modifier before noun

- ❌ "A real time collaboration feature."
- ✅ "A real-time collaboration feature."

### Unnecessary hyphen after noun

- ❌ "The collaboration is real-time."
- ✅ "The collaboration is real time."

### Hyphenating -ly adverbs

- ❌ "A newly-created document."
- ✅ "A newly created document."

---

## Technology Terms

### email

- ❌ "e-mail," "E-mail," "Email" (mid-sentence)
- ✅ "email"

### internet

- ❌ "Internet" (unless starting a sentence)
- ✅ "internet"

### website

- ❌ "web site," "Web site"
- ✅ "website"

### open source / open-source

- ❌ "An opensource project." / "The project is open-source."
- ✅ "An open-source project." (adjective before noun)
- ✅ "The project is open source." (after noun)

---

## Code in Content

### Bare code blocks

- ❌ ` ``` ` (no language tag)
- ✅ ` ```typescript `, ` ```groq `, ` ```json `, ` ```bash `

### Stale apiVersion dates

- ❌ `apiVersion: '2021-06-07'`
- ✅ `apiVersion: '2026-02-27'` (use a recent date)

### Product names in backticks

- ❌ `` `Content Lake` `` (it's a product name, not code)
- ✅ Content Lake
- ✅ `contentLake` (only if referring to a code identifier)

---

## Spelling (US English)

| ❌ British | ✅ American |
| ---------- | ----------- |
| colour     | color       |
| organise   | organize    |
| analyse    | analyze     |
| centre     | center      |
| licence    | license     |
| catalogue  | catalog     |
| behaviour  | behavior    |
| favourite  | favorite    |
| realise    | realize     |
| customise  | customize   |

---

## CMS Plural

- ❌ "CMS's," "CMSs," "CMS systems"
- ✅ "CMSes"

---

## Abbreviations

### Unnecessary acronym creation

- ❌ "The Content Delivery Network (CDN) improved performance." (only
  mentioned once — just say "content delivery network")
- ✅ "The content delivery network improved performance."

### Missing first-use expansion

- ❌ "Configure the PTE for your schema." (first mention, reader may
  not know PTE)
- ✅ "Configure the Portable Text Editor (PTE) for your schema."

---

## Review Shortcut

When doing a style review, check in this order:

1. Headings: sentence case?
2. Oxford commas: present in all lists?
3. Em dashes: any to replace?
4. Numbers: spelled out below 10, figures above?
5. Product names: correctly capitalized?
6. Code blocks: language tags present?
7. Spelling: US English throughout?
8. Hyphens: compound modifiers correct?
