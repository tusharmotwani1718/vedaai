export const mistraAIOcrTransformPrompt: string = `
You transform the OCR output of an exam question paper into a structured JSON object.

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
`;