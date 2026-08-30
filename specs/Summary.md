# VedaAI — Implementation Summary

Snapshot of everything built so far: architecture, what lives where, the end-to-end
flow, the edge cases that shaped the code, the assumptions baked in, and what is
still open.

**Status:** the backend pipeline is complete and wired end to end, from upload to
`questionId → highlight rectangles`. The frontend is a scaffold only. Nothing has
yet been run against a real handwritten answer sheet — every number in this
document comes from synthetic fixtures.

---

## 1. What the feature does

A teacher uploads a question paper and a student's answer sheet (PDF or image).
The app parses both, then shows a split screen: questions as a list on one side,
the actual answer document on the other. Clicking a question highlights the region
of the answer sheet where that student answered it.

No database, no authentication — everything lives in memory and is lost on restart.
That is a deliberate constraint from `00_Technical_requirements.md`, not an
oversight.

---

## 2. Architecture

Bun workspaces monorepo.

```
vedaai/
├── apps/
│   ├── api/          @vedaai/api     Express 5 on Bun, port 4000  ← all the logic
│   └── web/          @vedaai/web     Next.js 16 + Tailwind 4, port 3000  ← scaffold only
├── packages/
│   └── shared/       @vedaai/shared  types shared by both sides (raw TS, no build)
└── specs/                            requirements + this file
```

`@vedaai/shared` is consumed as raw TypeScript — no build step. Both sides import
from it, so a change to a response shape becomes a compile error on the other side
rather than a runtime surprise.

### Where each piece lives

| Path | Responsibility |
|---|---|
| `apps/api/src/app.ts` | Express app factory (CORS, JSON, router, error handler) |
| `apps/api/src/config.ts` | env config — `API_PORT`, `API_CORS_ORIGIN` |
| `apps/api/src/http-error.ts` | `HttpError` carrying status + machine-readable code |
| `apps/api/src/middleware/error-handler.ts` | 404 + central error handler |
| `apps/api/src/lib/memory-cache.ts` | bounded LRU used by every cache in the app |
| `apps/api/src/store/evaluation.store.ts` | in-memory home for processed evaluations + original bytes |
| `apps/api/src/routes/evaluation.route.ts` | the three HTTP endpoints |
| `apps/api/src/routes/evaluation.payload.ts` | internal state → JSON-safe wire format |
| `apps/api/src/ocr/utils/extraction.ts` | OCR calls, LLM transforms, pipeline orchestration |
| `apps/api/src/ocr/lib/constants.ts` | the two LLM prompts (question paper, answer sheet) |
| `apps/api/src/ocr/cache/ocr-transform.cache.ts` | the OCR→JSON cache, keyed on OCR content |
| `apps/api/src/ocr/lib/validators/validate.question-extraction.ts` | question paper checks |
| `apps/api/src/ocr/lib/validators/validate.answer-extraction.ts` | answer sheet OCR-consistency checks |
| `apps/api/src/ocr/lib/regions/derive-regions.ts` | text positions → highlight rectangles |
| `apps/api/src/ocr/lib/resolution/resolve-attempts.ts` | written label → questionId |
| `apps/api/src/ocr/scripts/run-extraction.ts` | dev harness: `bun run extraction [pdf]` |
| `packages/shared/src/types/ocr.types.ts` | the whole data model |

Roughly 3,900 lines of TypeScript, `strict` with `noUncheckedIndexedAccess`.

---

## 3. The data model, and the two rules that hold it together

### Rule 1 — every document has two shapes

```
Llm*Extraction          what the LLM is asked to return.
                        Sees OCR text + block ids ONLY.
                        Never emits coordinates or confidence scores.

QuestionPaper /         produced by our code afterwards: regions derived from
AnswerSheet             OCR boxes, validators run, confidence computed.
```

If a field needs geometry or cross-referencing, it must not exist on the LLM side
of that boundary — the model will hallucinate it.

### Rule 2 — coordinates never reach the LLM

`buildBlockInventory()` splits one OCR result into two things that travel
separately:

```ts
inventory: InventoryPage[]              // id + type + content  → sent to the LLM
geometry:  Map<string, BlockGeometry>   // id + pixel box       → stays in the process
```

The **block id is the join key**, and it is deterministic: `p<pageIndex>-b<blockIndex>`,
both 0-based, derived from raw OCR array indices. The LLM quotes ids back at us; we
look up coordinates ourselves. That is the entire reason region highlighting can be
trusted.

### Provenance / Text Origin

Every extracted unit carries a `TextOrigin`:

```ts
{ page: number, blockId: string, charStart: number, charEnd: number }
```

An answer carries **two** — `markerProvenance` (the "Q3" token) and
`bodyProvenance` (the answer text) — because the marker is what anchors the
highlight, and it is often in a different place from the body.

---

## 4. End-to-end flow

```
   POST /api/evaluations   (multipart: questionPaper, answerSheet)
             │
    ┌────────┴────────┐                      both OCR calls run concurrently
    ▼                 ▼
  OCR paper        OCR sheet                 mistral-ocr-latest
    │                 │                      → RawPage[] (blocks + pixel boxes)
    ▼                 ▼
  buildBlockInventory()                      splits inventory ⟂ geometry
    │                 │
    ▼                 ▼                      both transforms run concurrently
  transformOcrOutput  transformOcrOutputForAnswerSheet
    │                 │                      mistral-large-latest, separate prompts,
    │                 │                      separate schemas, separate cache keys
    ▼                 ▼
  validateExtraction  validateAnswerExtraction
    │                 │                      normalize pages, recover offsets,
    │                 │                      block existence, reconstruction, coverage
    │                 ▼
    │             deriveAttemptRegions()      geometry + offsets → PageRect[]
    │                 │
    └────────┬────────┘
             ▼
      mapAnswersToQuestions()                 the only step that reads BOTH documents
             │                                label → questionId, continuations, duplicates
             ▼
      buildQuestionAnswerIndex()              questionId → { attemptIds, region }
             │
             ▼
      store + toEvaluationPayload()           Maps → objects, geometry dropped
             │
             ▼
      201 { ok: true, data: EvaluationPayload }
```

### What the UI ends up with

```json
"mapping": {
  "A.1": {
    "questionId": "A.1",
    "attemptIds": ["a0", "a2"],
    "confidence": 0.9,
    "method": "label",
    "region": { "rects": [
      { "page": 0, "x0": 0.10, "y0": 0.100, "x1": 0.90, "y1": 0.200 },
      { "page": 1, "x0": 0.10, "y0": 0.050, "x1": 0.90, "y1": 0.250 }
    ]}
  }
}
```

Click question `A.1` → draw those two rectangles. Coordinates are fractions of the
page, so they hold at any zoom level.

---

## 5. HTTP surface

| Method | Route | Notes |
|---|---|---|
| `POST` | `/api/evaluations` | multipart `questionPaper` + `answerSheet`; runs the whole pipeline; `201` |
| `GET` | `/api/evaluations/:id` | stored result, nothing re-run |
| `GET` | `/api/evaluations/:id/documents/:kind` | original bytes; `kind` = `question-paper` \| `answer-sheet` |
| `GET` | `/api/health` | liveness |

Every JSON response uses one envelope: `{ ok: true, data }` or
`{ ok: false, error: { code, message } }`. Route handlers throw `HttpError`; the
central handler renders it. Express 5 forwards rejected promises from async
handlers automatically, so no route needs its own try/catch.

Uploads: 10 MB cap, 2 files, `multer.memoryStorage()` — documents never touch
disk. Accepted: PDF, PNG, JPEG, WebP, AVIF; anything else is `415` **before** any
API call is billed.

---

## 6. Caching

The spec is precise about this and it is easy to get wrong.

The cache key is **the generated OCR output**, never the uploaded document.
Mistral OCR can return different text for the same PDF across runs, so a
document-keyed cache would happily serve a JSON transform whose block ids and
character offsets no longer match the OCR they describe.

```ts
fingerprint = sha256({
  model,
  documentType,
  prompt: sha256(promptText),                          // hashed, not version-stamped
  schema: sha256(JSON.stringify(z.toJSONSchema(schema))),
  pages: [[id, type, content], …],                     // the OCR content itself
})
```

Everything in the key is an **input the LLM actually saw**. Consequences that fall
out of that for free:

- Re-running OCR on the same paper produces different text → different fingerprint
  → a miss. Invalidation needs no explicit eviction.
- `documentType` is in the key, so a question paper and an answer sheet that OCR
  identically cannot serve each other's JSON.
- Editing a prompt changes its hash → a miss. Nothing has to be remembered.
- Changing the response schema changes its hash → a miss. This matters because a
  cached entry is never re-parsed, so an old object could otherwise be served
  against a schema that has since gained a required field.
- Geometry is deliberately **excluded** — coordinates never reach the LLM, so they
  cannot influence the output and must not influence the key.

> **Why the prompt is hashed rather than versioned.** This originally used a
> hand-bumped `EXTRACTION_VERSION = '1'` constant. It was never bumped across two
> prompt edits in the same session — which is the whole problem with a manual
> lever. Hashing the real prompt and schema text cannot be forgotten.

To make it impossible for the key to describe one prompt while the call sends
another, the pair is declared once and used for both:

```ts
const QUESTION_PAPER_TRANSFORM = {
  prompt: mistraAIOcrTransformPrompt,
  schema: LlmQuestionPaperExtractionSchema,
} as const;
```

Two typed stores (`MemoryCache<LlmQuestionPaperExtraction>` and
`MemoryCache<LlmAnswerSheetExtraction>`), 50 entries each. The evaluation store is
bounded at 10 because each entry holds two whole documents in memory.

Cached extractions are `structuredClone`d in and out: validators mutate the
extraction in place, so a shared reference would let one request corrupt another's
cache entry.

### What this cache does *not* do

**Raw OCR output is never cached.** Every upload re-runs — and re-bills — OCR.
Combined with OCR being non-deterministic, that means re-uploading the same PDF
usually produces different text → a different fingerprint → a miss → another LLM
call.

That is correct per the spec, and it is exactly the wrong-data hazard the spec is
guarding against. But it means this cache is a **correctness mechanism, not a
cost-saving one**: in normal use it rarely hits. It earns its keep during
development, when the same in-memory `RawPage[]` is transformed twice, and it is
what stops a prompt edit from silently returning the previous prompt's JSON.

Saving OCR cost would need a *separate* `fileHash → OCR output` cache. That would
not violate the rule — the JSON cache stays keyed on OCR content — but it would
mean OCR stops regenerating for a repeat upload. Not built; see §10.

---

## 7. Edge cases solved

These are the ones that actually shaped the code. Each is verified.

### 7.1 Several answers inside one OCR block

Block segmentation follows visual whitespace, not answers. This is routine:

```
p0-b0  (y 200→600px on a 2000px page, 4 lines = 100px per line)

  "Q1. Cloud is on-demand.      line 0  ┐ answer a0
   It scales.                   line 1  ┘  y 0.100–0.200
   Q3(a). Types are full…       line 2  ┐ answer a1
   Both abstract hw."           line 3  ┘  y 0.200–0.300
```

One box, two answers. Highlighting the block highlights both. The fix is to slice
the box **by line**: each answer's band runs from its own marker down to the start
of the next marker on the sheet. `a0` stops at `0.200`, exactly where `a1` begins.

Interpolating by line rather than by character offset matters — lines differ wildly
in length, so character-proportion puts the boundary in the wrong place.

### 7.2 `\b` never matches between "Q" and "1"

The original label normalizer was:

```ts
.replace(/\b(q|que|ques|question)\b\s*[.:)-]?\s*/g, '')
```

`"Q.4(b)"` and `"Ans 3"` worked, because the separator creates a word boundary.
`"Q1"` did **not** — `q` and `1` are both word characters, so there is no boundary
between them and the `q` survived. Every bare `Q1`, `Q4`, `Q3(a)` resolved to
nothing. The passing cases were exactly the ones that hid the bug.

```ts
// fixed: digit lookahead instead of a trailing \b, alternations longest-first
// (regex alternation is leftmost-first, so "q" was shadowing "question")
.replace(/\b(?:question|ques|que|q)\s*[.:)-]?\s*(?=\d)/g, '')
```

### 7.3 Page numbering off by one

`buildBlockInventory` numbers pages from 1 for the LLM, while block ids,
`RawPage.index` and `PageRect` are all 0-based. `TextOrigin.page` came back 1-based
and would have highlighted the wrong page on every multi-page document.

Rather than adding or subtracting 1 — which breaks if the model copies the other
convention — the page is **recomputed from the block id**, which we generated and
is therefore authoritative:

```
"p1-b0" → page 1   (0-based, regardless of what the model claimed)
```

### 7.4 Optional sections failed marks arithmetic

`checkStructure` computed `marksPerQuestion × totalQuestions`. A section reading
*"Attempt any 5 of 7, 10 marks each"* totals **50**, not 70 — so every optional
section was a false hard failure. Now multiplies by `attemptCount`, falling back to
`totalQuestions` (where the two are equal for compulsory sections) when the model
omits it.

### 7.5 An answer continued on a later page

`"Q1 contd."` on page 2 stays its own attempt, linked back via `continuesFrom`, and
inherits its parent's `questionId` at capped confidence. Both regions end up under
one question, so a single click highlights across the page break:

```
A.1  attempts=[a0, a2]  rects: p0 y[0.100–0.200], p1 y[0.050–0.250]
```

Continuations are linked walking in **sheet order**, so a link can only ever point
backwards — a cycle is impossible by construction.

### 7.6 The same label in two sections

Papers that restart numbering per section put a "4" in both PART-A and PART-B.
Resolution uses section context: the section of the most recently resolved attempt,
since students work through the paper section by section and blocks are walked in
reading order.

```
a1 "Q3(a)" → A.3.a   (unique, 0.95)   → context = section A
a2 "Q4"    → A.4     (0.7, LOW_CONFIDENCE_MAPPING raised)
```

With no usable context it stays `unresolved` rather than guessing — a wrong mapping
files a student's answer under someone else's question, which is worse than a gap.

### 7.7 Answering a part means the question was answered

A student writing `3(a)` produced `A.3.a`, which left `A.3` listed as *unattempted*
and made `3(a)` + `3(b)` count as two answered questions against a section's
`attemptCount`. A `parentQuestionOf` index now rolls parts up, and the mapping is
filed under **both** ids so clicking either finds the answer.

### 7.8 Rough work between two answers

A scribble block sitting between answers would be swallowed into the band above it.
Blocks referenced only by `unmatchedText` are stepped over; the band simply splits
into two rects, which `Region.rects` already allows:

```
A.4 rects: p0 y[0.200–0.300]   … skips rough work at y 0.35 …   p0 y[0.500–0.700]
```

### 7.9 Image uploads would have failed outright

`extractOcr` hardcoded `data:application/pdf;base64,` and always sent
`{ type: 'document_url' }`. Mistral requires `{ type: 'image_url' }` for images, so
every PNG/JPEG upload — explicitly allowed by the spec — would have failed. The
variant is now chosen from the mime type.

### 7.10 Cache collision between the two document types

`fingerprintOcr(inventory, model)` had no document type in the key, and answer
extractions were being written into a `MemoryCache<LlmQuestionPaperExtraction>`.
Same OCR text under the two prompts produced the same key.

Now doubly separated — by `documentType`, and by the prompt/schema hashes, since
the two document types necessarily use different ones. Identical OCR text:

```
questionPaper  4ed641010788fb8e2be0…
answerSheet    80dca556b7db9b344831…
```

### 7.11 The model miscounts characters

`charStart`/`charEnd` from the LLM are frequently wrong. Offset recovery locates
the claimed text verbatim in the block and overwrites the offsets. If only a
whitespace-normalized match is found, the offsets are kept but flagged
`APPROXIMATE_OFFSETS`. Regions are derived **after** validation for exactly this
reason — slicing on the model's guessed positions would highlight the wrong lines.

### 7.12 `Map` does not survive `JSON.stringify`

`byQuestionId` and `geometry` are both `Map`s and stringify to `{}`. The mapping
becomes a plain object via `Object.fromEntries`; geometry is dropped entirely,
since it is internal pixel-space machinery and the client only needs the normalized
rects already baked into the regions.

### 7.13 Degenerate geometry

`toRawPages` defaults missing page dimensions to `0`, and dividing by that yields
`NaN` rectangles that would render as invisible or full-page highlights. Guarded
explicitly — a zero-size page produces no rects and a `NO_REGION` issue instead.

### 7.14 Two markers on the same line

Leaves nothing to slice between them. Falls back to that attempt's own marker+body
span and raises `REGION_FALLBACK`.

### 7.15 A prompt edit serving the previous prompt's JSON

Cache invalidation on prompt changes was originally a hand-bumped constant,
`EXTRACTION_VERSION = '1'`. The mechanism worked; nobody pulled the lever. It was
never bumped across two separate edits to the answer-sheet prompt, so the same
OCR would have returned JSON built by the *old* prompt with no indication
anything was stale.

Replaced with hashes of the actual prompt text and the actual response schema, so
invalidation is a property of the inputs rather than of someone remembering. The
schema is included because a cached entry is never re-parsed — a schema gaining a
required field would otherwise be served an object that predates it.

The two are declared as one `{ prompt, schema }` pair and used for *both* the
fingerprint and the LLM call, so the key cannot describe one prompt while the
request sends another.

---

## 8. How problems are surfaced

Nothing retries, and nothing re-runs OCR on a bad result. Every problem becomes a
flat, UI-ready issue in one vocabulary:

```ts
{ severity: 'error' | 'warning', code: string, scope: string, message: string }
```

| Code | Severity | Meaning |
|---|---|---|
| `BLOCK_MISSING` | error | the model cited a block id we never generated |
| `TEXT_MISMATCH` | error | slicing the block by its offsets does not reproduce the claimed text |
| `NO_REGION` | error | no drawable rectangle could be derived |
| `ORPHAN_CONTINUATION` | error | a "contd" with no earlier attempt to attach to |
| `UNRESOLVED_ATTEMPT` | error | a written label that maps to no question |
| `MALFORMED_BLOCK_ID` | warning | id does not follow `p<page>-b<block>` |
| `APPROXIMATE_OFFSETS` | warning | matched only after whitespace normalization |
| `LOW_CONFIDENCE_MAPPING` | warning | resolved by section context, not a unique label |
| `DUPLICATE_ATTEMPT` | warning | two attempts map to the same question |
| `OVER_ATTEMPTED` | warning | more answers than `attemptCount` allows |
| `UNCLAIMED_BLOCK` | warning | a block nothing references — never silently drop handwriting |
| `OVERLAPPING_BLOCKS` | warning | neighbouring block boxes overlap >20% |
| `REGION_FALLBACK` | warning | band collapsed; highlighting only the attempt's own span |
| `MODEL_UNCERTAINTY` | warning | the model's own `uncertainties` |

---

## 9. Assumptions

Things the code takes as true that could turn out not to be.

**Geometry**
1. Lines within an OCR block are **evenly spaced**. Vertical slicing interpolates
   linearly by line index. A block mixing a heading with body text will slice
   slightly off.
2. A highlight spans the **full block width**. Mistral returns block boxes, not
   glyph boxes, so there is no honest way to narrow a rect to part of a line.
3. An answer's extent is **marker → next marker**. The last answer on a sheet runs
   to the end of the document.

**Resolution**
4. Students work through a paper **section by section**, which is what makes the
   ambiguity tiebreak sound. A student jumping A→B→A gets a wrong section context.
5. A written label is **the student's claim about which question they answered**.
   No content matching is done, so a mislabelled answer maps to the wrong question.
6. `attemptCount` is the correct multiplier for section marks.

**Pipeline**
7. Mistral block ids are stable **within one OCR run** — true by construction, since
   we generate them from array indices.
8. Processing synchronously is acceptable: two OCR calls + two LLM calls, likely
   30–120s on a real multi-page paper. There is no job queue because there is no
   database to hold job state.
9. Single process, single user. All state is in-memory and per-process, so the
   API cannot be horizontally scaled as-is.

---

## 10. Scope for improvement

**Not built**
- **Predicted marks.** The spec mentions `(predicted / max)` accumulating per
  section and overall. Denominators are in the payload (`marks`, `marksPerQuestion`,
  `sectionTotal`, `attemptCount`, `maxMarks`); no predicted score is computed. With
  no answer key or rubric, any number would be arbitrary — this needs a decision
  before it is worth building.
- **Which answers count when a student over-attempts.** "Attempt any 5" with 6
  answered raises `OVER_ATTEMPTED` and stops. Best-5 vs first-5 is a marking-policy
  decision, not a validation one.
- **The frontend.** `apps/web` is a scaffold with a health-check page. Blocked on
  the Figma file.
- **Tests.** There is no test file for the validators, regions, or resolution —
  verification was done with throwaway scripts (24/24, 21/21, 21/21, 19/19) that
  were deleted after each run. Converting those fixtures into `bun test` files is
  a half-hour of work and would protect every edge case in section 7.

**Known rough edges**
- The question-paper validator predates the shared issue vocabulary and still
  returns bare `{ scope, ok, reason }` rows. Worth unifying so the UI reads one
  list.
- `extractOcr` returns a `{ success, message, error }` envelope while the transform
  functions throw. Two error styles in one module.
- `buildPaperLabelIndex` is built twice per `mapAnswersToQuestions` call. Trivially
  cheap, but untidy.
- Adjacent rects are not merged. Deliberate — merging breaks on multi-column
  layouts — but a same-column merge pass would produce cleaner highlights.
- The evaluation store is bounded by **entry count**, not bytes. Ten large PDFs is
  a lot of memory.

**Would improve accuracy**
- **Content-match resolution.** `ResolutionMethod` already allows `'content-match'`
  and `'manual'`; neither is implemented. Content matching would rescue unlabelled
  answers; a manual override would let a teacher fix a wrong mapping in the UI.
- **Crop-and-re-OCR marker verification.** The type comments anticipate this:
  crop the marker's rect, re-OCR just that, and confirm it reads what the model
  claimed. The strongest possible check on the anchor that positions every
  highlight.
- **An OCR-level cache keyed by file hash**, so re-uploading the same document
  during a demo does not re-bill and re-randomise. This does not violate the
  caching rule — the JSON cache stays keyed on OCR content — but it was raised and
  never decided.

**Open questions**
- The Figma file (UI is specified as strict against it).
- A real handwritten answer sheet. Every assumption in section 9 is untested
  against actual handwriting OCR, which is where they are most likely to break.
- Whether predicted marks are in scope at all.

---

## 11. Running it

```bash
bun install
cp apps/api/.env.example apps/api/.env    # add MISTRAL_API_KEY
bun run dev                                # api :4000 + web :3000
```

| Command | Does |
|---|---|
| `bun run dev` | both apps in watch mode |
| `bun run typecheck` | `tsc --noEmit` across all three workspaces |
| `bun run --filter '@vedaai/api' extraction [pdf]` | run the question-paper pipeline against a local file |
| `bun test` | the API test suite (health only, today) |

`MISTRAL_API_KEY` is the only required variable. `API_PORT` (4000),
`API_CORS_ORIGIN` (`http://localhost:3000`) and `NEXT_PUBLIC_API_URL`
(`http://localhost:4000`) all have working defaults.

> **Note:** an earlier commit put a live Mistral key in a tracked `.env.example`.
> It has been removed from the working tree, but it is still in git history and
> should be rotated.
