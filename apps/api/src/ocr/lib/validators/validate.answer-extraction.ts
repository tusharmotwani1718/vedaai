// Validation engine for the ANSWER SHEET side of the pipeline.
//
// Mirrors validate.question-extraction.ts: everything is checked by comparing
// the LLM's transformed output against the block inventory built from the raw
// OCR pages. Nothing here talks to a model, and no coordinate ever enters or
// leaves this file — geometry stays in the enrichment step.
//
// The output is deliberately shaped for display: `issues` is a flat, ordered
// list the UI can render as-is. Failures are reported, never repaired by
// re-running OCR.

import type {
  AnswerValidationIssue,
  InventoryPage,
  IssueSeverity,
  LlmAnswerSheetExtraction,
  TextOrigin,
} from '@vedaai/shared';

import { pageIndexFromBlockId, type PageNormalization } from './validate.question-extraction';

// ============================================================
// Shared helpers
// ============================================================

function norm(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function indexBlocks(inventory: InventoryPage[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const page of inventory) {
    for (const b of page.blocks) {
      m.set(b.id, b.content);
    }
  }
  return m;
}

/**
 * Reading order of every block on the sheet: page order, then block order
 * within the page. Derived from the inventory rather than by parsing ids, so it
 * stays correct even if the id scheme changes.
 */
function indexBlockOrdinals(inventory: InventoryPage[]): Map<string, number> {
  const m = new Map<string, number>();
  let ordinal = 0;
  for (const page of inventory) {
    for (const b of page.blocks) {
      m.set(b.id, ordinal);
      ordinal += 1;
    }
  }
  return m;
}

// ============================================================
// Issue list — what the UI renders
// ============================================================

// The shapes themselves are part of the wire contract, so they are defined in
// `@vedaai/shared` and re-exported here — this file is still where the issue
// vocabulary is produced, and every existing importer keeps working.
export type { AnswerValidationIssue, IssueSeverity };

// ============================================================
// LEVEL 0a — Page index normalization
// ============================================================
//
// Same off-by-one trap as the question paper: the inventory handed to the LLM
// numbers pages from 1, while block ids and PageRect are 0-based. Recompute the
// page from the block id, which we generated, instead of trusting the model.
// Both provenances on every attempt are normalized, plus unmatched text.

export function normalizeAttemptPageIndices(
  extracted: LlmAnswerSheetExtraction,
): PageNormalization[] {
  const results: PageNormalization[] = [];

  const apply = (scope: string, origin: TextOrigin): void => {
    const page = pageIndexFromBlockId(origin.blockId);
    if (page === null) {
      results.push({
        questionId: scope,
        blockId: origin.blockId,
        ok: false,
        from: origin.page,
        to: origin.page,
      });
      return;
    }
    results.push({
      questionId: scope,
      blockId: origin.blockId,
      ok: true,
      from: origin.page,
      to: page,
    });
    origin.page = page;
  };

  extracted.attempts.forEach((attempt, i) => {
    apply(`attempt ${i} marker`, attempt.markerProvenance);
    apply(`attempt ${i} body`, attempt.bodyProvenance);
  });

  (extracted.unmatchedText ?? []).forEach((u, i) => {
    apply(`unmatched ${i}`, u.TextOrigin);
  });

  return results;
}

// ============================================================
// LEVEL 0b — Offset recovery
// ============================================================
//
// The model counts characters badly. Where the claimed text can be found
// verbatim in the block it points at, overwrite its offsets with the real ones.
// Attempts carry two origins, so each is recovered independently.

export type OffsetStatus = 'recovered' | 'kept-model' | 'not-found';

export interface AttemptOffsetRecovery {
  attemptId: string;
  /** Which origin this row is about. */
  field: 'marker' | 'body';
  status: OffsetStatus;
  blockId: string;
  charStart: number;
  charEnd: number;
  note?: string;
}

function recoverOne(
  blocks: Map<string, string>,
  attemptId: string,
  field: 'marker' | 'body',
  origin: TextOrigin,
  claimed: string,
): AttemptOffsetRecovery {
  const content = blocks.get(origin.blockId); // from the inventory

  if (content === undefined) {
    return {
      attemptId,
      field,
      status: 'not-found',
      blockId: origin.blockId,
      charStart: origin.charStart,
      charEnd: origin.charEnd,
      note: 'blockId not in inventory',
    };
  }

  const needle = claimed.trim(); // from the LLM transformed json
  if (needle.length === 0) {
    return {
      attemptId,
      field,
      status: 'not-found',
      blockId: origin.blockId,
      charStart: origin.charStart,
      charEnd: origin.charEnd,
      note: 'claimed text is empty',
    };
  }

  // Exact match first — that yields offsets usable for slicing.
  const rawIdx = content.indexOf(needle);
  if (rawIdx !== -1) {
    origin.charStart = rawIdx;
    origin.charEnd = rawIdx + needle.length;
    return {
      attemptId,
      field,
      status: 'recovered',
      blockId: origin.blockId,
      charStart: origin.charStart,
      charEnd: origin.charEnd,
    };
  }

  // Handwriting OCR rarely round-trips whitespace exactly; a normalized hit
  // still means the text is there, but the offsets stay approximate.
  if (norm(content).includes(norm(needle))) {
    return {
      attemptId,
      field,
      status: 'kept-model',
      blockId: origin.blockId,
      charStart: origin.charStart,
      charEnd: origin.charEnd,
      note: 'found in normalized content but not raw; offsets approximate',
    };
  }

  return {
    attemptId,
    field,
    status: 'not-found',
    blockId: origin.blockId,
    charStart: origin.charStart,
    charEnd: origin.charEnd,
    note: 'claimed text not found in block content',
  };
}

export function recoverAttemptOffsets(
  extracted: LlmAnswerSheetExtraction,
  inventory: InventoryPage[],
  attemptIds: string[],
): AttemptOffsetRecovery[] {
  const blocks = indexBlocks(inventory);

  return extracted.attempts.flatMap((attempt, i) => {
    const attemptId = attemptIds[i] ?? `a${i}`;
    // The marker is matched on markerText when the model isolated it, and on
    // the claimed label otherwise.
    const markerNeedle = attempt.markerText ?? attempt.claimedLabel;
    return [
      recoverOne(blocks, attemptId, 'marker', attempt.markerProvenance, markerNeedle),
      recoverOne(blocks, attemptId, 'body', attempt.bodyProvenance, attempt.text),
    ];
  });
}

// ============================================================
// LEVEL 1 — Block existence
// ============================================================

export interface BlockExistenceResult {
  scope: string;
  blockId: string;
  ok: boolean;
}

export function checkAttemptBlockExistence(
  extracted: LlmAnswerSheetExtraction,
  inventory: InventoryPage[],
  attemptIds: string[],
): BlockExistenceResult[] {
  const blocks = indexBlocks(inventory);
  const out: BlockExistenceResult[] = [];

  extracted.attempts.forEach((attempt, i) => {
    const attemptId = attemptIds[i] ?? `a${i}`;
    for (const [field, origin] of [
      ['marker', attempt.markerProvenance],
      ['body', attempt.bodyProvenance],
    ] as const) {
      out.push({
        scope: `${attemptId} ${field}`,
        blockId: origin.blockId,
        ok: blocks.has(origin.blockId),
      });
    }
  });

  (extracted.unmatchedText ?? []).forEach((u, i) => {
    out.push({
      scope: `unmatched ${i}`,
      blockId: u.TextOrigin.blockId,
      ok: blocks.has(u.TextOrigin.blockId),
    });
  });

  return out;
}

// ============================================================
// LEVEL 2 — Reconstruction
// ============================================================
//
// Slice the block by the (now recovered) offsets and confirm it still matches
// the claimed text. After a successful recovery this passes by construction;
// it is what catches the attempts recovery could not fix.

export interface AttemptReconResult {
  attemptId: string;
  field: 'marker' | 'body';
  ok: boolean;
  reason?: string;
  expected?: string;
  got?: string;
}

function reconstructOne(
  blocks: Map<string, string>,
  attemptId: string,
  field: 'marker' | 'body',
  origin: TextOrigin,
  claimed: string,
): AttemptReconResult {
  const content = blocks.get(origin.blockId);
  if (content === undefined) {
    return { attemptId, field, ok: false, reason: 'block missing' };
  }

  const { charStart, charEnd } = origin;
  if (charStart < 0 || charEnd > content.length || charStart >= charEnd) {
    return {
      attemptId,
      field,
      ok: false,
      reason: `offsets out of range [${charStart},${charEnd}] len ${content.length}`,
    };
  }

  const sliced = norm(content.slice(charStart, charEnd));
  const wanted = norm(claimed);
  const ok = sliced.includes(wanted) || wanted.includes(sliced);

  return ok
    ? { attemptId, field, ok }
    : { attemptId, field, ok: false, reason: 'slice≠text', expected: sliced, got: wanted };
}

export function checkAttemptReconstruction(
  extracted: LlmAnswerSheetExtraction,
  inventory: InventoryPage[],
  attemptIds: string[],
): AttemptReconResult[] {
  const blocks = indexBlocks(inventory);

  return extracted.attempts.flatMap((attempt, i) => {
    const attemptId = attemptIds[i] ?? `a${i}`;
    const markerNeedle = attempt.markerText ?? attempt.claimedLabel;
    return [
      reconstructOne(blocks, attemptId, 'marker', attempt.markerProvenance, markerNeedle),
      reconstructOne(blocks, attemptId, 'body', attempt.bodyProvenance, attempt.text),
    ];
  });
}

// ============================================================
// Sheet order
// ============================================================
//
// Students answer out of sequence, so position on the sheet is its own fact,
// independent of question order. Order is (block reading order, charStart) of
// the MARKER — the body can trail across blocks, the marker cannot.

export interface SheetPosition {
  /** Index into `extracted.attempts`. */
  index: number;
  attemptId: string;
  /** 1-based position on the sheet. */
  orderOnSheet: number;
}

function computeSheetOrder(
  extracted: LlmAnswerSheetExtraction,
  inventory: InventoryPage[],
): SheetPosition[] {
  const ordinals = indexBlockOrdinals(inventory);
  const LAST = Number.MAX_SAFE_INTEGER; // unknown blocks sort to the end

  return extracted.attempts
    .map((attempt, index) => ({
      index,
      blockOrdinal: ordinals.get(attempt.markerProvenance.blockId) ?? LAST,
      charStart: attempt.markerProvenance.charStart,
    }))
    .sort((a, b) =>
      a.blockOrdinal !== b.blockOrdinal
        ? a.blockOrdinal - b.blockOrdinal
        : a.charStart !== b.charStart
          ? a.charStart - b.charStart
          : a.index - b.index,
    )
    .map((row, i) => ({
      index: row.index,
      // Ids follow sheet order, so the same OCR always yields the same ids.
      attemptId: `a${i}`,
      orderOnSheet: i + 1,
    }));
}

// ============================================================
// LEVEL 5 — Coverage
// ============================================================
//
// "Never silently drop handwritten content." Every block in the inventory must
// be claimed by an attempt marker, an attempt body, or unmatchedText. Whatever
// is left over is reported so the teacher can see what the pipeline ignored.

export interface CoverageResult {
  totalBlocks: number;
  referencedBlocks: number;
  /** Blocks nothing referenced, with a preview so the UI can show them. */
  unreferenced: Array<{ blockId: string; preview: string }>;
}

export function checkCoverage(
  extracted: LlmAnswerSheetExtraction,
  inventory: InventoryPage[],
): CoverageResult {
  const referenced = new Set<string>();
  for (const attempt of extracted.attempts) {
    referenced.add(attempt.markerProvenance.blockId);
    referenced.add(attempt.bodyProvenance.blockId);
  }
  for (const u of extracted.unmatchedText ?? []) {
    referenced.add(u.TextOrigin.blockId);
  }

  const unreferenced: CoverageResult['unreferenced'] = [];
  let totalBlocks = 0;

  for (const page of inventory) {
    for (const b of page.blocks) {
      totalBlocks += 1;
      if (!referenced.has(b.id)) {
        const preview = norm(b.content);
        unreferenced.push({
          blockId: b.id,
          preview: preview.length > 80 ? `${preview.slice(0, 80)}…` : preview,
        });
      }
    }
  }

  return {
    totalBlocks,
    referencedBlocks: totalBlocks - unreferenced.length,
    unreferenced,
  };
}

// ============================================================
// Orchestrator
// ============================================================

export interface AnswerValidationReport {
  /** attemptIds in sheet order — the index every other list keys on. */
  sheetOrder: SheetPosition[];
  pageNormalization: PageNormalization[];
  offsetRecovery: AttemptOffsetRecovery[];
  blockExistence: BlockExistenceResult[];
  reconstruction: AttemptReconResult[];
  coverage: CoverageResult;
  /** Flat, ordered, UI-ready. Errors first. */
  issues: AnswerValidationIssue[];
  summary: { hardFailures: number; warnings: number };
}

/**
 * Runs the whole answer-sheet validation engine.
 *
 * Mutates `extracted` in place (page indices and recovered offsets), the same
 * way validateExtraction does on the question side, so downstream enrichment
 * reads corrected values.
 *
 * Nothing here retries or re-runs OCR: a low-quality extraction is reported
 * through `issues` and shown to the teacher.
 */
export function validateAnswerExtraction(
  extracted: LlmAnswerSheetExtraction,
  inventory: InventoryPage[],
): AnswerValidationReport {
  // 1. page indices — every later step reads TextOrigin.page
  const pageNormalization = normalizeAttemptPageIndices(extracted);

  // 2. sheet order, which assigns the attemptIds everything else keys on
  const sheetOrder = computeSheetOrder(extracted, inventory);
  const attemptIds: string[] = [];
  for (const pos of sheetOrder) attemptIds[pos.index] = pos.attemptId;

  // 3. offsets, then the text checks that depend on them
  const offsetRecovery = recoverAttemptOffsets(extracted, inventory, attemptIds);
  const blockExistence = checkAttemptBlockExistence(extracted, inventory, attemptIds);
  const reconstruction = checkAttemptReconstruction(extracted, inventory, attemptIds);

  // 4. cross-checks
  const coverage = checkCoverage(extracted, inventory);

  // ---- build the display list ---------------------------------------------
  const issues: AnswerValidationIssue[] = [];

  for (const r of blockExistence.filter((r) => !r.ok)) {
    issues.push({
      severity: 'error',
      code: 'BLOCK_MISSING',
      scope: r.scope,
      message: `block ${r.blockId} is not in the OCR inventory`,
    });
  }

  for (const r of reconstruction.filter((r) => !r.ok)) {
    issues.push({
      severity: 'error',
      code: 'TEXT_MISMATCH',
      scope: `${r.attemptId} ${r.field}`,
      message: r.reason ?? 'extracted text does not match the OCR block',
    });
  }

  for (const r of pageNormalization.filter((r) => !r.ok)) {
    issues.push({
      severity: 'warning',
      code: 'MALFORMED_BLOCK_ID',
      scope: r.questionId,
      message: `block id "${r.blockId}" does not follow p<page>-b<block>`,
    });
  }

  for (const r of offsetRecovery.filter((r) => r.status === 'kept-model')) {
    issues.push({
      severity: 'warning',
      code: 'APPROXIMATE_OFFSETS',
      scope: `${r.attemptId} ${r.field}`,
      message: r.note ?? 'offsets are approximate',
    });
  }

  for (const b of coverage.unreferenced) {
    issues.push({
      severity: 'warning',
      code: 'UNCLAIMED_BLOCK',
      scope: `block ${b.blockId}`,
      message: `nothing references this block: "${b.preview}"`,
    });
  }

  for (const u of extracted.uncertainties ?? []) {
    issues.push({
      severity: 'warning',
      code: 'MODEL_UNCERTAINTY',
      scope: 'sheet',
      message: u,
    });
  }

  const hardFailures = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.length - hardFailures;

  return {
    sheetOrder,
    pageNormalization,
    offsetRecovery,
    blockExistence,
    reconstruction,
    coverage,
    issues,
    summary: { hardFailures, warnings },
  };
}
