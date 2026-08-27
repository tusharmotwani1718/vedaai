// Region derivation — turns text positions into rectangles the UI can draw.
//
// The validator tells us WHERE IN THE TEXT an answer lives (blockId +
// charStart/charEnd). buildBlockInventory tells us WHERE ON THE PAGE each block
// sits (BlockGeometry, in the OCR's pixel space). This file joins the two.
//
// Coordinates never reach the LLM and never came from it — they are read
// straight from the OCR block boxes and sliced here in code, which is the whole
// point of keeping `geometry` out of the inventory.
//
// The hard part is that a block box covers the WHOLE block, and OCR routinely
// puts several answers in one block:
//
//   "Q3. Cloud service models are IaaS, PaaS and SaaS.\nQ4. Migration is hard."
//
// One box, two answers. Highlighting the block highlights both. So a block is
// sliced vertically by LINE, and each answer gets the band running from its own
// marker down to the start of the next marker on the sheet.

import type {
  BlockGeometry,
  InventoryPage,
  LlmAnswerSheetExtraction,
  PageRect,
  Region,
} from '@vedaai/shared';

import type {
  AnswerValidationIssue,
  SheetPosition,
} from '../validators/validate.answer-extraction';

// ============================================================
// Block index — reading order + geometry + line offsets
// ============================================================

export interface IndexedBlock {
  id: string;
  /** Global reading order: page order, then block order within the page. */
  ordinal: number;
  geometry: BlockGeometry;
  content: string;
  /** Character offset at which each line starts. */
  lineStarts: number[];
  lineCount: number;
}

export interface BlockIndex {
  blocks: IndexedBlock[];
  byId: Map<string, IndexedBlock>;
  /** Inventory blocks that had no geometry — they cannot be highlighted. */
  missingGeometry: string[];
}

function computeLineStarts(content: string): number[] {
  const starts = [0];
  for (let i = 0; i < content.length; i += 1) {
    if (content[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

/**
 * Pairs each inventory block with its geometry, in reading order.
 *
 * A block whose geometry is missing is recorded rather than dropped silently —
 * it means the id the model used is not one we generated.
 */
export function buildBlockIndex(
  inventory: InventoryPage[],
  geometry: Map<string, BlockGeometry>,
): BlockIndex {
  const blocks: IndexedBlock[] = [];
  const byId = new Map<string, IndexedBlock>();
  const missingGeometry: string[] = [];

  for (const page of inventory) {
    for (const b of page.blocks) {
      const g = geometry.get(b.id);
      if (g === undefined) {
        missingGeometry.push(b.id);
        continue;
      }

      const lineStarts = computeLineStarts(b.content);
      const block: IndexedBlock = {
        id: b.id,
        ordinal: blocks.length,
        geometry: g,
        content: b.content,
        lineStarts,
        lineCount: lineStarts.length,
      };

      blocks.push(block);
      byId.set(b.id, block);
    }
  }

  return { blocks, byId, missingGeometry };
}

/** Which line a character offset falls on (0-based). */
export function lineIndexAt(block: IndexedBlock, charIndex: number): number {
  const target = Math.max(0, Math.min(charIndex, block.content.length));

  let lo = 0;
  let hi = block.lineStarts.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (block.lineStarts[mid]! <= target) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

// ============================================================
// Slicing a block box by line
// ============================================================

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * The rectangle covering lines [fromLine, toLine) of a block, normalized to
 * fractions of the page.
 *
 * Vertical position is interpolated by line, which assumes lines within a block
 * are evenly spaced — true enough for OCR blocks, and far closer than
 * interpolating by character offset, since lines differ wildly in length.
 *
 * Horizontal extent is always the full block width: Mistral returns block
 * boxes, not glyph boxes, so there is no honest way to narrow a rect to part of
 * a line. Guessing would put the highlight in the wrong place.
 */
export function sliceBlockRect(
  block: IndexedBlock,
  fromLine: number,
  toLine: number,
): PageRect | null {
  const { box, page, pageWidth, pageHeight } = block.geometry;

  // toRawPages defaults missing dimensions to 0; dividing by that yields NaN.
  if (pageWidth <= 0 || pageHeight <= 0) return null;

  const top = box.topLeftY;
  const height = box.bottomRightY - top;
  if (height <= 0) return null;

  const lines = Math.max(1, block.lineCount);
  const f0 = Math.max(0, Math.min(fromLine, lines)) / lines;
  const f1 = Math.max(0, Math.min(toLine, lines)) / lines;
  if (f1 <= f0) return null;

  return {
    page,
    x0: clamp01(box.topLeftX / pageWidth),
    y0: clamp01((top + height * f0) / pageHeight),
    x1: clamp01(box.bottomRightX / pageWidth),
    y1: clamp01((top + height * f1) / pageHeight),
  };
}

/** The rect for one text span — used to locate a marker token. */
export function rectForTextSpan(
  index: BlockIndex,
  blockId: string,
  charStart: number,
  charEnd: number,
): PageRect | null {
  const block = index.byId.get(blockId);
  if (block === undefined) return null;

  const fromLine = lineIndexAt(block, charStart);
  const toLine = lineIndexAt(block, Math.max(charStart, charEnd - 1)) + 1;
  return sliceBlockRect(block, fromLine, toLine);
}

// ============================================================
// Overlapping block boxes
// ============================================================

function verticalOverlap(a: BlockGeometry, b: BlockGeometry): number {
  const top = Math.max(a.box.topLeftY, b.box.topLeftY);
  const bottom = Math.min(a.box.bottomRightY, b.box.bottomRightY);
  return Math.max(0, bottom - top);
}

function horizontalOverlap(a: BlockGeometry, b: BlockGeometry): number {
  const left = Math.max(a.box.topLeftX, b.box.topLeftX);
  const right = Math.min(a.box.bottomRightX, b.box.bottomRightX);
  return Math.max(0, right - left);
}

/**
 * Neighbouring blocks whose boxes overlap.
 *
 * The spec calls this out: OCR blocks are not always cleanly separated. An
 * overlap does not break the math, but it means two answers' bands can cover
 * some of the same pixels, so it is worth surfacing.
 */
export function findOverlappingBlocks(
  index: BlockIndex,
): Array<{ a: string; b: string; overlap: number }> {
  const found: Array<{ a: string; b: string; overlap: number }> = [];

  for (let i = 1; i < index.blocks.length; i += 1) {
    const prev = index.blocks[i - 1]!;
    const cur = index.blocks[i]!;
    if (prev.geometry.page !== cur.geometry.page) continue;

    const vy = verticalOverlap(prev.geometry, cur.geometry);
    const hx = horizontalOverlap(prev.geometry, cur.geometry);
    if (vy <= 0 || hx <= 0) continue;

    const prevHeight = prev.geometry.box.bottomRightY - prev.geometry.box.topLeftY;
    const curHeight = cur.geometry.box.bottomRightY - cur.geometry.box.topLeftY;
    const shortest = Math.max(1, Math.min(prevHeight, curHeight));

    found.push({ a: prev.id, b: cur.id, overlap: vy / shortest });
  }

  return found;
}

// ============================================================
// Attempt bands
// ============================================================

export interface AttemptRegion {
  attemptId: string;
  /** The band to highlight for this answer. One rect per block segment. */
  region: Region;
  /** Just the marker token — the anchor to scroll to. */
  markerRect: PageRect | null;
  /**
   * True when the band could not be built from marker-to-next-marker and fell
   * back to the attempt's own marker + body spans.
   */
  usedFallback: boolean;
}

export interface RegionDerivationResult {
  regions: AttemptRegion[];
  /** Same UI-ready shape the validator emits, so the UI has one vocabulary. */
  issues: AnswerValidationIssue[];
}

interface Anchor {
  ordinal: number;
  line: number;
}

function anchorFor(index: BlockIndex, blockId: string, charStart: number): Anchor | null {
  const block = index.byId.get(blockId);
  if (block === undefined) return null;
  return { ordinal: block.ordinal, line: lineIndexAt(block, charStart) };
}

/**
 * Derives one highlight band per attempt.
 *
 * The band runs from the attempt's own marker to the start of the next marker
 * in sheet order, which is what `Attempt.region` describes. Blocks claimed only
 * by `unmatchedText` (rough work, crossed-out writing) are stepped over rather
 * than swallowed, so a scribble between two answers does not get highlighted as
 * part of the one above it. Skipping a block simply splits the band into two
 * rects, which `Region.rects` already allows for.
 */
export function deriveAttemptRegions(
  extracted: LlmAnswerSheetExtraction,
  sheetOrder: SheetPosition[],
  inventory: InventoryPage[],
  geometry: Map<string, BlockGeometry>,
): RegionDerivationResult {
  const index = buildBlockIndex(inventory, geometry);
  const issues: AnswerValidationIssue[] = [];
  const regions: AttemptRegion[] = [];

  for (const blockId of index.missingGeometry) {
    issues.push({
      severity: 'warning',
      code: 'BLOCK_WITHOUT_GEOMETRY',
      scope: `block ${blockId}`,
      message: 'no coordinates for this block; anything anchored to it cannot be highlighted',
    });
  }

  for (const o of findOverlappingBlocks(index)) {
    if (o.overlap < 0.2) continue; // ignore hairline touches
    issues.push({
      severity: 'warning',
      code: 'OVERLAPPING_BLOCKS',
      scope: `blocks ${o.a}, ${o.b}`,
      message: `block boxes overlap by ${Math.round(o.overlap * 100)}% — highlights may cover the same pixels`,
    });
  }

  // Blocks that only rough work / unmatched writing refers to. A block a real
  // attempt also points at stays in, since the answer genuinely lives there.
  const attemptBlocks = new Set<string>();
  for (const a of extracted.attempts) {
    attemptBlocks.add(a.markerProvenance.blockId);
    attemptBlocks.add(a.bodyProvenance.blockId);
  }
  const unmatchedOnly = new Set<string>();
  for (const u of extracted.unmatchedText ?? []) {
    if (!attemptBlocks.has(u.TextOrigin.blockId)) unmatchedOnly.add(u.TextOrigin.blockId);
  }

  const lastBlock = index.blocks[index.blocks.length - 1];

  sheetOrder.forEach((pos, i) => {
    const attempt = extracted.attempts[pos.index];
    if (attempt === undefined) return;

    const markerRect = rectForTextSpan(
      index,
      attempt.markerProvenance.blockId,
      attempt.markerProvenance.charStart,
      attempt.markerProvenance.charEnd,
    );

    const start = anchorFor(
      index,
      attempt.markerProvenance.blockId,
      attempt.markerProvenance.charStart,
    );

    if (start === null || lastBlock === undefined) {
      issues.push({
        severity: 'error',
        code: 'NO_REGION',
        scope: pos.attemptId,
        message: `marker block ${attempt.markerProvenance.blockId} has no geometry; this answer cannot be highlighted`,
      });
      regions.push({
        attemptId: pos.attemptId,
        region: { rects: [] },
        markerRect,
        usedFallback: false,
      });
      return;
    }

    // The band ends where the next answer begins; the last answer runs to the
    // end of the document.
    const next = sheetOrder[i + 1];
    const nextAttempt = next === undefined ? undefined : extracted.attempts[next.index];
    const end =
      nextAttempt === undefined
        ? { ordinal: lastBlock.ordinal, line: lastBlock.lineCount }
        : (anchorFor(
            index,
            nextAttempt.markerProvenance.blockId,
            nextAttempt.markerProvenance.charStart,
          ) ?? { ordinal: lastBlock.ordinal, line: lastBlock.lineCount });

    const rects: PageRect[] = [];
    for (let ordinal = start.ordinal; ordinal <= end.ordinal; ordinal += 1) {
      const block = index.blocks[ordinal];
      if (block === undefined) continue;

      // Never skip the block the marker itself is in.
      if (ordinal !== start.ordinal && unmatchedOnly.has(block.id)) continue;

      const fromLine = ordinal === start.ordinal ? start.line : 0;
      const toLine = ordinal === end.ordinal ? end.line : block.lineCount;

      const rect = sliceBlockRect(block, fromLine, toLine);
      if (rect !== null) rects.push(rect);
    }

    // Two markers on the same line of the same block leave nothing to slice.
    // Fall back to what this attempt itself claims.
    let usedFallback = false;
    if (rects.length === 0) {
      usedFallback = true;
      for (const origin of [attempt.markerProvenance, attempt.bodyProvenance]) {
        const rect = rectForTextSpan(index, origin.blockId, origin.charStart, origin.charEnd);
        if (rect !== null) rects.push(rect);
      }

      issues.push({
        severity: 'warning',
        code: 'REGION_FALLBACK',
        scope: pos.attemptId,
        message:
          'the next answer starts on the same line as this one; highlighting only its own text span',
      });
    }

    if (rects.length === 0) {
      issues.push({
        severity: 'error',
        code: 'NO_REGION',
        scope: pos.attemptId,
        message: 'no drawable rectangle could be derived for this answer',
      });
    }

    regions.push({ attemptId: pos.attemptId, region: { rects }, markerRect, usedFallback });
  });

  return { regions, issues };
}
