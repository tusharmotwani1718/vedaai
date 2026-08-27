// This file is validate the blocks from the ocr extraction.
// The validation runs against the llm transformed output and the parsed ocr text. The comparison is done between the inventory of raw OCR pages built from buildInventory(RawOCRPage) and the llm transformed output.

import type {
  InventoryPage,
  LlmQuestionPaperExtraction,
  LlmExtractedQuestion,
} from '@vedaai/shared';

// ============================================================
// Shared: flatten questions, index blocks
// ============================================================

interface FlatQuestion {
  questionId: string; // "B.3" for logging
  q: LlmExtractedQuestion;
}

function flattenQuestions(extracted: LlmQuestionPaperExtraction): FlatQuestion[] {
  return extracted.sections.flatMap((s) =>
    s.questions.map((q) => ({ questionId: `${s.sectionId}.${q.displayLabel}`, q })),
  );
}

function indexBlocks(inventory: InventoryPage[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const page of inventory) {
    for (const b of page.blocks) {
      // for each block of each page of the inventory
      m.set(b.id, b.content);
    }
  }
  return m;
}

function norm(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

// ============================================================
// LEVEL 0a — Page index normalization
// ============================================================
//
// buildBlockInventory numbers the pages it hands the LLM from 1, while block
// ids, RawPage.index and PageRect are all 0-based. Rather than trust the model
// to have copied the right convention into TextOrigin.page, we recompute the
// page from the block id — an id we generated ourselves, so it is
// authoritative. Without this, every derived region is off by one page.

const BLOCK_ID_PATTERN = /^p(\d+)-b\d+$/;

/** The 0-based page index encoded in a block id, or null if it is malformed. */
export function pageIndexFromBlockId(blockId: string): number | null {
  const match = BLOCK_ID_PATTERN.exec(blockId);
  if (match === null) return null;
  return Number.parseInt(match[1]!, 10);
}

export interface PageNormalization {
  questionId: string;
  blockId: string;
  ok: boolean;
  /** The page the LLM claimed. */
  from: number;
  /** The page the block id implies (equal to `from` when the id is malformed). */
  to: number;
}

/**
 * Rewrites TextOrigin.page on every question and part to the 0-based page index
 * implied by its block id. Mutates `extracted` in place, the same way
 * recoverOffsets does, so every later check sees corrected values.
 *
 * A malformed block id is reported but left untouched — checkBlockExistence
 * fails it anyway, and guessing a page here would only mask the real problem.
 */
export function normalizePageIndices(extracted: LlmQuestionPaperExtraction): PageNormalization[] {
  const results: PageNormalization[] = [];

  const apply = (questionId: string, origin: { page: number; blockId: string }): void => {
    const page = pageIndexFromBlockId(origin.blockId);
    if (page === null) {
      results.push({
        questionId,
        blockId: origin.blockId,
        ok: false,
        from: origin.page,
        to: origin.page,
      });
      return;
    }
    results.push({ questionId, blockId: origin.blockId, ok: true, from: origin.page, to: page });
    origin.page = page;
  };

  for (const { questionId, q } of flattenQuestions(extracted)) {
    apply(questionId, q.TextOrigin);
    (q.parts ?? []).forEach((part, i) => {
      apply(questionId + '.' + (part.label || String(i + 1)), part.TextOrigin);
    });
  }

  return results;
}


// ============================================================
// LEVEL 0 — Offset recovery --> charStart/charEnd match from inventory block with the llm transformed output block.
// ============================================================
//
// Block's charStart/charEnd offsets from parsed ocr against llm transformed output.

export interface OffsetRecovery {
  questionId: string;
  status: 'recovered' | 'kept-model' | 'not-found';
  blockId: string;
  charStart: number;
  charEnd: number;
  note?: string;
}

export function recoverOffsets(
  extracted: LlmQuestionPaperExtraction,
  inventory: InventoryPage[],
): OffsetRecovery[] {
  const blocks = indexBlocks(inventory);
  const results: OffsetRecovery[] = [];

  for (const { questionId, q } of flattenQuestions(extracted)) {
    const origin = q.TextOrigin; // from the llm transformed output
    const content = blocks.get(origin.blockId); // from the inventory

    if (content === undefined) {
      // block id is not in the inventory
      results.push({
        questionId,
        status: 'not-found',
        blockId: origin.blockId,
        charStart: origin.charStart,
        charEnd: origin.charEnd,
        note: 'blockId not in inventory',
      });
      continue;
    }
    
    // block present in the inventory
    // Try to locate the question text verbatim in the block.
    // Strip a leading "N. " from the claimed text since the block may or may not include it.
    const questionInTransformedJson = norm(q.text).replace(/^\d+[.)]\s*/, '');
    const normContentBlock = norm(content);
    const idx = normContentBlock.indexOf(questionInTransformedJson); // find the question from transformed json in the block from parsed ocr (inventory).

    

    if (idx === -1) {
      // Couldn't find it — keep the model's offsets but flag hard.
      results.push({
        questionId,
        status: 'not-found',
        blockId: origin.blockId,
        charStart: origin.charStart,
        charEnd: origin.charEnd,
        note: 'question text not found in block content',
      });
      continue;
    }

    // NOTE: idx is into normalized content. For exact raw offsets you need to map
    // back through the whitespace normalization. For a first pass, re-run indexOf
    // on RAW content with a raw needle; fall back to normalized only if that misses.
    const rawLLMTransformedJsonQuestion = q.text.replace(/^\d+[.)]\s*/, '').trim();
    const rawIdx = content.indexOf(rawLLMTransformedJsonQuestion);

    if (rawIdx !== -1) {
      // Mutate the extraction in place so downstream uses corrected offsets.
      origin.charStart = rawIdx;
      origin.charEnd = rawIdx + rawLLMTransformedJsonQuestion.length;
      results.push({
        questionId,
        status: 'recovered',
        blockId: origin.blockId,
        charStart: origin.charStart,
        charEnd: origin.charEnd,
      });
    } else {
      results.push({
        questionId,
        status: 'kept-model',
        blockId: origin.blockId,
        charStart: origin.charStart,
        charEnd: origin.charEnd,
        note: 'found in normalized content but not raw; offsets approximate',
      });
    }
  }

  return results;
}

// ============================================================
// LEVEL 1 — Block existence (cheapest hard failure)
// ============================================================

export function checkBlockExistence(
  extracted: LlmQuestionPaperExtraction,
  inventory: InventoryPage[],
): Array<{ questionId: string; ok: boolean; blockId: string }> {
  const blocks = indexBlocks(inventory);
  return flattenQuestions(extracted).map(({ questionId, q }) => ({
    questionId,
    blockId: q.TextOrigin.blockId,
    ok: blocks.has(q.TextOrigin.blockId),
  }));
}

// ============================================================
// LEVEL 2 — Reconstruction (the strongest text check)
// ============================================================
//
// After offset recovery, slice the block by the (now exact) offsets and confirm
// it matches the claimed text. If recovery worked this passes by construction;
// if you skip recovery it catches the model's counting errors.

export interface ReconResult {
  questionId: string;
  ok: boolean;
  reason?: string;
  expected?: string;
  got?: string;
}

export function checkReconstruction(
  extracted: LlmQuestionPaperExtraction,
  inventory: InventoryPage[],
): ReconResult[] {
  const blocks = indexBlocks(inventory);
  return flattenQuestions(extracted).map(({ questionId, q }) => {
    const { blockId, charStart, charEnd } = q.TextOrigin; // from the llm transformed output
    const content = blocks.get(blockId); // from the inventory
    if (content === undefined) return { questionId, ok: false, reason: 'block missing' };
    if (charStart < 0 || charEnd > content.length || charStart >= charEnd)
      return {
        questionId,
        ok: false,
        reason: `offsets out of range [${charStart},${charEnd}] len ${content.length}`,
      };

    const sliced = norm(content.slice(charStart, charEnd)); // slice the block content with offsets from the model
    const claimed = norm(q.text).replace(/^\d+[.)]\s*/, ''); // question from the llm transformed output
    const ok = sliced.includes(claimed) || claimed.includes(sliced);
    return ok
      ? { questionId, ok }
      : { questionId, ok: false, reason: 'slice≠text', expected: sliced, got: claimed };
  });
}



// ============================================================
// LEVEL 3 — Structural invariants (marks arithmetic, counts)
// ============================================================

export function checkStructure(
  extracted: LlmQuestionPaperExtraction,
): Array<{ scope: string; ok: boolean; reason?: string }> {
  const out: Array<{ scope: string; ok: boolean; reason?: string }> = [];

  for (const s of extracted.sections) {
    // declared count vs actual
    out.push({
      scope: `section ${s.sectionId} count`,
      ok: s.questions.length === s.totalQuestions,
      reason:
        s.questions.length === s.totalQuestions
          ? undefined
          : `declared ${s.totalQuestions}, got ${s.questions.length}`,
    });

    // Marks arithmetic against rawMarksExpression, if present.
    //
    // The multiplier is attemptCount, NOT totalQuestions: a section reading
    // "Attempt any 5 of 7, 10 marks each" totals 50, not 70 — using
    // totalQuestions made every optional section a false failure. Falling
    // back to totalQuestions keeps compulsory sections right (there the two
    // are equal) when the model omits attemptCount.
    if (s.marksPerQuestion != null && s.sectionTotal != null) {
      const countedQuestions = s.attemptCount > 0 ? s.attemptCount : s.totalQuestions;
      const expected = s.marksPerQuestion * countedQuestions;
      out.push({
        scope: `section ${s.sectionId} marks`,
        ok: expected === s.sectionTotal,
        reason:
          expected === s.sectionTotal
            ? undefined
            : `${s.marksPerQuestion}*${countedQuestions}=${expected}≠${s.sectionTotal}`,
      });
    }

    // contiguous, 1-based orderInSection
    const orders = s.questions.map((q) => q.orderInSection).sort((a, b) => a - b);
    const contiguous = orders.every((o, i) => o === i + 1);
    out.push({
      scope: `section ${s.sectionId} ordering`,
      ok: contiguous,
      reason: contiguous ? undefined : `orders not 1..n: ${orders.join(',')}`,
    });
  }

  // overall max marks: sum of section totals
  const declaredMax = extracted.metadata.maxMarks;
  if (declaredMax != null) {
    const summed = extracted.sections.reduce((acc, s) => acc + (s.sectionTotal ?? 0), 0);
    out.push({
      scope: 'paper maxMarks',
      ok: summed === declaredMax,
      reason:
        summed === declaredMax ? undefined : `sections sum ${summed} ≠ declared ${declaredMax}`,
    });
  }

  return out;
}

// ============================================================
// Orchestrator — run in order, return a report
// ============================================================

export interface ValidationReport {
  pageNormalization: PageNormalization[];
  offsetRecovery: OffsetRecovery[];
  blockExistence: ReturnType<typeof checkBlockExistence>;
  reconstruction: ReconResult[];
  structure: ReturnType<typeof checkStructure>;
  summary: { hardFailures: number; warnings: number };
}

export function validateExtraction(
  extracted: LlmQuestionPaperExtraction,
  inventory: InventoryPage[],
): ValidationReport {
  // 1. normalize page indices first — every later step reads TextOrigin.page
  const pageNormalization = normalizePageIndices(extracted);
  // 2. recover offsets — mutates extracted.TextOrigin to exact values where possible
  const offsetRecovery = recoverOffsets(extracted, inventory);
  // 2. then the checks, which now see corrected offsets
  const blockExistence = checkBlockExistence(extracted, inventory);
  const reconstruction = checkReconstruction(extracted, inventory);
  const structure = checkStructure(extracted);

  const hardFailures =
    offsetRecovery.filter((r) => r.status === 'not-found').length +
    blockExistence.filter((r) => !r.ok).length +
    reconstruction.filter((r) => !r.ok).length +
    structure.filter((r) => !r.ok).length;

  // A malformed block id is not counted here: checkBlockExistence already
  // records it as a hard failure, and counting it twice would skew the summary.
  const warnings =
    offsetRecovery.filter((r) => r.status === 'kept-model').length +
    pageNormalization.filter((r) => !r.ok).length;

  return {
    pageNormalization,
    offsetRecovery,
    blockExistence,
    reconstruction,
    structure,
    summary: { hardFailures, warnings },
  };
}
