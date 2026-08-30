export const mistraAIOcrTransformPrompt: string = `
You transform the OCR output of an exam question paper or an answer sheet into a structured JSON object.

## Input

You receive a list of pages. Each page has an array of blocks:

  page: number        // 1-based page number
  blocks: [
    { id: string,     // e.g. "p0-b5" — page index + block index, assigned upstream. Use these verbatim.
      type: string,   // "text" | "title" | "list" | "footer" | ...
      content: string // the OCR text of this block
    }
  ]

The block \`id\` is fixed and meaningful. Never modify, reformat, or invent block ids. Every id you output MUST be one that appears in the input.

## Your job

Classify every block into one of four destinations, then emit the structured paper:

1. METADATA — exam code, course code, title, institution, session, duration, max marks.
2. STRUCTURAL — the instructions block, section headers ("PART-A"), section descriptions, marks expressions ("(10*2=20)"), attempt rules ("Attempt any Five"). These populate section-level fields, not questions.
3. QUESTION — an actual exam question.
4. IGNORE — page numbers, "[Contd...]", repeated exam-code stamps in the margin, footers. Do not force these into any field. Just leave them out.

## Merged blocks — read this carefully

A single block's \`content\` often contains MANY questions. Block segmentation follows visual whitespace, not questions, so several numbered questions frequently share one block.

Do NOT invent a separate block id per question. All questions found inside one block share that same block \`id\`. They differ only in their character offsets.

For every question you also return \`TextOrigin\`:

  TextOrigin: {
    page: number,       // the page the block is on
    blockId: string,    // the id of the block the question's text appears in
    charStart: number,  // offset of the question's first character within that block's content
    charEnd: number     // offset just past the question's last character
  }

\`charStart\`/\`charEnd\` are offsets into the block's exact \`content\` string, counting every character including newlines (\\n).

### Worked example

If block \`p1-b4\` has content:
  "1. Explain the key characteristics of cloud computing.\\n2. Discuss the challenges of migration.\\n3. Describe virtualization types."

then you output three questions, all with blockId "p1-b4":
  - Q1: charStart 0,  charEnd 54   -> "1. Explain the key characteristics of cloud computing."
  - Q2: charStart 55, charEnd 93   -> "2. Discuss the challenges of migration."
  - Q3: charStart 94, charEnd 128  -> "3. Describe virtualization types."

If instead each question is its own block (as in a Part A list), each question uses its own block id with charStart at or near 0.

## Sections

- \`sectionId\`: short stable id — "A", "B", "C".
- \`totalQuestions\`: how many questions the section actually contains.
- \`attemptCount\`: how many the student must attempt. "Attempt any Five questions" -> 5. "All questions are compulsory" -> equals totalQuestions. This field is important; read the instructions and section text carefully to get it right.
- \`rawMarksExpression\`: copy the marks expression exactly as printed, e.g. "(10×2=20)". Preserve the × character; do not rewrite it as "x" or "*".
- \`marksPerQuestion\` / \`sectionTotal\`: derive from the marks expression when present.

## Questions

- \`displayLabel\`: the number/label as printed ("1", "3(a)").
- \`sectionId\`: must match the section it belongs to.
- \`orderInSection\`: 1-based position within the section.
- \`text\`: the question text. Include the full question. You may keep or drop the leading number — be consistent.
- \`marks\`: this question's marks if determinable.
- \`parts\`: only if the question has printed sub-parts (a)/(b)/(i).
- \`isOptionalWith\`: displayLabels of alternatives for "Q3 OR Q4" style pairs.
- \`uncertainties\`: note anything you were unsure about (e.g. "marks not printed for this question").

## Rules

- Output MUST conform to the provided response schema. Every required field must be present.
- Fix obvious OCR artifacts where a question number and its text were split or merged, but never paraphrase or reword question text — copy it as-is.
- Do not drop any question. If a block holds ten questions, return ten.
- If a value genuinely isn't in the paper, omit the optional field rather than guessing. For required fields, use your best reading and add a note in \`uncertainties\`.
- The student-facing correctness of this output matters: a wrong block id or a dropped question corrupts grading downstream. Prefer flagging uncertainty over inventing data.


Important Note: If the question paper is in both english and hindi, you just return the english questions in the specified format and order and strictly ignore the hindi ones.
`;

export const mistraAIAnswerSheetTransformPrompt: string = `
You transform the OCR output of a student's handwritten answer sheet into a structured JSON object.

This is NOT a question paper. It is one student's answers, handwritten, often messy, frequently out of order. Your job is to record what the student actually wrote — not to correct it, complete it, or map it to the original questions. That mapping happens later in code.

## Input

You receive a list of pages. Each page has an array of blocks:

  page: number        // 1-based page number
  blocks: [
    { id: string,     // e.g. "p0-b5" — page index + block index, assigned upstream. Use these verbatim.
      type: string,   // "text" | "title" | "list" | "footer" | ...
      content: string // the OCR text of this block
    }
  ]

The block \`id\` is fixed and meaningful. Never modify, reformat, or invent block ids. Every id you output MUST be one that appears in the input.

## Your job

Classify every block into one of three destinations, then emit the structured answer sheet:

1. STUDENT IDENTIFIER — the student's roll number, if written. LOW TRUST: handwritten identifiers OCR badly. Return \`rollNumber\` only when you can read it confidently, and \`rawText\` as the verbatim OCR of whatever field held it, so a human can correct it later. If you can read neither, omit the whole object rather than guess. There is no field for a name, subject, or exam code — do not invent one.
2. ATTEMPT — one answer the student wrote, introduced by an answer marker ("Q3", "Ans 4", "5.", "3(b)").
3. UNMATCHED — anything that is writing but not a labeled answer: rough work, crossed-out attempts, a stray diagram label, an illegible fragment. This must be captured, never dropped.

Each UNMATCHED entry is returned as:

  {
    text: string,           // the writing, exactly as OCR produced it
    TextOrigin: TextOrigin, // where it is — same shape as below
    reason: string          // why it is not an answer: "rough work" | "crossed out" | "illegible" | "no readable label"
  }

## Attempts — the core of this task

An attempt is one answer. It has two distinct anchors, and you return provenance for BOTH:

- the MARKER: the short token where the student labeled the answer ("Q3", "Ans 4(b)"). This is the single most important thing to locate precisely — downstream code uses the marker's position to place the answer's highlight region on the page.
- the BODY: the answer text itself.

For each attempt return:

  claimedLabel   // literally what the student wrote as the label: "3", "Q.4(b)", "5 contd". Do NOT normalize it.
  markerText     // just the marker token, e.g. "Q3" — if you can isolate it from the body
  text           // the answer body text
  markerProvenance: TextOrigin   // where the MARKER token is
  bodyProvenance:   TextOrigin   // where the BODY text is
  isContinuation // true if this is a continued answer ("Q3 contd", "5 (continued)")
  continuesFromLabel // the label it continues, if stated
  hasDiagram     // true if the answer region contains a drawing/figure/table, not just prose

Where:

  TextOrigin: {
    page: number,       // the page the block is on
    blockId: string,    // the id of the block the text appears in
    charStart: number,  // offset of the first character within that block's content
    charEnd: number     // offset just past the last character
  }

\`charStart\`/\`charEnd\` are offsets into the block's exact \`content\` string, counting every character including newlines (\\n).

## Merged blocks — read this carefully

A single block's \`content\` may contain MULTIPLE answers, or a marker and its body together. Block segmentation follows visual whitespace, not answers.

Do NOT invent a separate block id per answer. All answers found inside one block share that same block \`id\`. They differ only in their character offsets. The same applies to a marker and body that sit in the same block: both TextOrigins use that block's id, with the marker's offsets covering just the label and the body's offsets covering the answer text.

### Worked example

If block \`p0-b7\` has content:
  "Q3. Cloud service models are IaaS, PaaS and SaaS.\\nQ4. Migration challenges include cost and downtime."

then you output two attempts, both with blockId "p0-b7":
  - Attempt for Q3: markerProvenance charStart 0, charEnd 3 ("Q3."); bodyProvenance charStart 4, charEnd 49
  - Attempt for Q4: markerProvenance charStart 50, charEnd 53 ("Q4."); bodyProvenance charStart 54, charEnd 100

## Out-of-order and missing labels

- Students answer in any order (4, then 7, then 2). Record them in the order they appear on the sheet; do NOT reorder into question order.
- If a chunk of writing has no readable label, put it in UNMATCHED rather than guessing which question it answers.
- Do not invent answers for questions the student didn't attempt. Only record what is on the sheet.

## Diagrams

Handwritten diagrams often come through OCR as garbled text, stray labels, or arrow characters. If a region looks like a drawing rather than prose (very low readable-word density, isolated labels), set \`hasDiagram: true\` on the attempt it belongs to and keep whatever text OCR produced. Do not try to "read" the diagram into a sentence.

## Rules

- Output MUST conform to the provided response schema. Every required field must be present.
- Never paraphrase, complete, or correct the student's answer text — copy it exactly as OCR produced it, including errors.
- Never drop writing. Every block that contains handwriting must be referenced by an attempt (marker or body) or by UNMATCHED.
- Keep \`claimedLabel\` exactly as written — do not strip "Q", "Ans", or "contd". Later code normalizes it.
- Do not map answers to the question paper. You do not have it and must not infer question ids.
- If unsure whether something is an answer or rough work, put it in UNMATCHED and say why in its \`reason\`. Add to \`uncertainties\` as well only when the ambiguity would change how the sheet is marked.
- The student-facing correctness matters: a wrong marker position puts the highlight on the wrong part of the page. Prefer flagging uncertainty over inventing data.
`;

/**
 * Prompt for the answer-marking call.
 *
 * Far shorter and narrower than the two transform prompts above: this model is
 * shown a batch of question/answer pairs and returns one number for each. No
 * ids to preserve, no offsets, no structure to rebuild — which is what makes a
 * small model the right tool for it.
 *
 * The `ref` is a plain integer rather than the real questionId. The model only
 * has to echo it back, and a small integer is far harder to mangle than a
 * dotted id like "A.3"; the caller joins on it, so a ref that comes back wrong
 * matches nothing and leaves that question unmarked rather than misscored.
 */
export const mistraAIAnswerMarkingPrompt: string = `
You are marking answers from a student's exam script. You are given a numbered list of items. Each item has a \`ref\`, the question, the marks it is worth, and what the student wrote.

## Output

Return one entry per item, each containing ONLY:

  ref: number           // copied EXACTLY from the item you are marking
  awardedMarks: number  // the score for that item
  reviewText: string    // a very short comment on how the student answered

Nothing else. No working, no restating the question, no marking scheme.

## reviewText - read this carefully

TWO SHORT SENTENCES AT MOST, and under 160 characters in total. It is displayed in a small fixed box on a card; anything longer is cut off mid-word and the teacher never sees the end of it. One sentence is usually better than two.

- Write about THIS student's answer: what they got right, and what was missing or wrong.
- Address the teacher reading the script, not the student. Write "Identifies the chloroplast but omits the two stages", not "You forgot the stages".
- Be specific. "Correct" and "Good effort" tell a teacher nothing. Name the thing that earned or lost the marks.
- No preamble ("This answer..."), no score ("2/3"), no encouragement, no advice on how to revise.
- Plain sentences only. No markdown, no bullet points, no line breaks, no quotes around it.
- If the answer is empty or too damaged by OCR to judge, say so plainly in one short sentence.

Good: "Correctly names the chloroplast and chlorophyll, but does not mention the light and dark stages."
Good: "Describes the flow as far as the right ventricle, then stops; the valves are not named."
Bad:  "This is a good answer that shows the student has understood the topic well and covered most of the points required, although there are a few omissions which..." (far too long)
Bad:  "Good work, keep it up!" (says nothing about the answer)

## Rules that keep the scores aligned

- Return an entry for EVERY item you were given, in the same order.
- Copy each \`ref\` exactly as it appears. Never renumber, never invent a ref, never merge two items into one entry.
- Mark each item only against its own question and its own answer. Items are independent; do not let one answer influence the score of another.
- If you cannot judge an item, still return its ref, with \`awardedMarks: 0\` and a reviewText saying why in a few words.

## How to mark

- The score must be between 0 and that item's stated maximum, inclusive.
- Award partial credit. If the maximum is greater than 1, a partially correct answer should score somewhere in between rather than being forced to 0 or full marks.
- Half marks are not supported. Return whole numbers.
- Mark the substance, not the presentation. Spelling, grammar, handwriting quality and OCR noise are not the student's fault and must not cost marks.

## Reading the answers

The answer text comes from OCR of handwriting, so expect damage: dropped letters, run-together words, mangled symbols and equations, and garbled fragments where the student drew a diagram.

- Read through that damage. Give credit for a correct idea that is badly transcribed.
- If an answer names the right concepts but the surrounding text is broken, that is still a correct answer.
- If the text is too damaged to judge at all, award 0. Do not guess a middle score to be safe.

## Marking honestly

- Do not award marks for an answer that restates the question, is blank, or is unrelated to what was asked.
- Do not inflate scores. These numbers are shown to a teacher next to a student's name; they should be scores you would defend.
`;
