import fs from 'node:fs/promises';

import { Mistral } from '@mistralai/mistralai';
import type { OCRPageObject } from '@mistralai/mistralai/models/components';
import { z } from 'zod';
import {
  type BlockGeometry,
  type ErrorResponse,
  type InventoryPage,
  type LlmAnswerSheetExtraction,
  type LlmQuestionPaperExtraction,
  type RawPage,
  type Response,
  LlmAnswerSheetExtractionSchema,
  LlmQuestionPaperExtractionSchema,
} from '@vedaai/shared';

import {
  fingerprintOcr,
  getCachedAnswerSheet,
  getCachedQuestionPaper,
  setCachedAnswerSheet,
  setCachedQuestionPaper,
  type TransformDocumentType,
} from '../cache/ocr-transform.cache';
import {
  mistraAIAnswerMarkingPrompt,
  mistraAIAnswerSheetTransformPrompt,
  mistraAIOcrTransformPrompt,
} from '../lib/constants';
import { deriveAttemptRegions, type AttemptRegion } from '../lib/regions/derive-regions';
import {
  buildPaperLabelIndex,
  buildQuestionAnswerIndex,
  resolveAnswerSheet,
  type AnswerResolutionReport,
  type QuestionAnswer,
} from '../lib/resolution/resolve-attempts';
import {
  validateAnswerExtraction,
  type AnswerValidationReport,
} from '../lib/validators/validate.answer-extraction';
import {
  validateExtraction,
  type ValidationReport,
} from '../lib/validators/validate.question-extraction';

/**
 * Model ids, overridable per environment.
 *
 * `mistral-large-latest` is NOT the default: it is listed by `models.list()` but
 * returns 403 `tier_not_allowed` on lower subscription tiers, which surfaces as
 * an opaque SDK error deep inside the transform. `mistral-medium-latest` is the
 * most capable model that works on a standard key.
 *
 * Changing either of these changes the cache fingerprint, so a model switch
 * invalidates cached transforms automatically.
 */
export const OCR_MODEL = process.env.MISTRAL_OCR_MODEL ?? 'mistral-ocr-latest';
export const TRANSFORM_MODEL = process.env.MISTRAL_TRANSFORM_MODEL ?? 'mistral-medium-latest';

export type OcrGenerationProps =
  | {
      fileUrl: string; // for cloud docs
      filePath?: never; // for local docs
      fileBytes?: never;
      mimeType?: never;
      documentType: TransformDocumentType;
    }
  | {
      fileUrl?: never;
      filePath: string;
      fileBytes?: never;
      /** Inferred from the extension when omitted. */
      mimeType?: string;
      documentType: TransformDocumentType;
    }
  | {
      fileUrl?: never;
      filePath?: never;
      /** An upload held in memory — the app never writes documents to disk. */
      fileBytes: Uint8Array;
      mimeType: string;
      documentType: TransformDocumentType;
    };

/** Mime types Mistral OCR accepts, and how each must be sent. */
const MIME_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

export const SUPPORTED_UPLOAD_MIME_TYPES = Object.values(MIME_BY_EXTENSION);

function mimeFromPath(filePath: string): string {
  const dot = filePath.lastIndexOf('.');
  const ext = dot === -1 ? '' : filePath.slice(dot).toLowerCase();
  return MIME_BY_EXTENSION[ext] ?? 'application/pdf';
}

/** Shape of `Response.data` returned by {@link extractOcr} on success. */
export interface OcrExtractionData {
  pages: RawPage[];
  /**
   * Echoed back from the request. OCR itself is identical for both document
   * types — the distinction only matters at the transform step — so carrying it
   * here is what lets a caller hand the result to the right transform.
   */
  documentType: TransformDocumentType;
  usageInfo?: unknown;
}

/**
 * The SDK client is built on first use rather than at import time, so this
 * module can be imported (by routes, by tests, by the type checker) in an
 * environment that has no API key configured.
 */
let client: Mistral | null = null;

function getClient(): Mistral {
  if (client !== null) return client;

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY is not set — add it to apps/api/.env');
  }

  client = new Mistral({ apiKey });
  return client;
}

// <----------------------------------------------------------------------------->
// Block types that actually carry content + geometry (everything except the Unknown catch-all).
const KNOWN_BLOCK_TYPES = new Set([
  'text',
  'title',
  'list',
  'table',
  'image',
  'footer',
  'header',
  'caption',
  'code',
  'equation',
  'aside_text',
  'references',
  'signature',
]);

// A block guaranteed to have content + coordinates. Derived from the SDK union
// by excluding the Unknown<"type"> member.
type ContentBlock = {
  type: string;
  content: string;
  topLeftX: number;
  topLeftY: number;
  bottomRightX: number;
  bottomRightY: number;
};

/** Narrows a raw union block to one that has content + geometry, or null for the Unknown catch-all. */
function asContentBlock(block: unknown): ContentBlock | null {
  if (
    block &&
    typeof block === 'object' &&
    'type' in block &&
    typeof (block as { type: unknown }).type === 'string' &&
    KNOWN_BLOCK_TYPES.has((block as { type: string }).type) &&
    'content' in block &&
    'topLeftX' in block
  ) {
    return block as ContentBlock;
  }
  return null;
}

export function toRawPages(pages: OCRPageObject[]): RawPage[] {
  return pages.map((page) => ({
    index: page.index,
    dimensions: {
      width: page.dimensions?.width ?? 0,
      height: page.dimensions?.height ?? 0,
      dpi: page.dimensions?.dpi ?? undefined,
    },
    blocks: (page.blocks ?? []).flatMap((raw) => {
      const b = asContentBlock(raw);
      if (!b) return []; // flatMap + [] = drop, no nulls in the result
      return [
        {
          type: b.type,
          content: b.content,
          box: {
            topLeftX: b.topLeftX,
            topLeftY: b.topLeftY,
            bottomRightX: b.bottomRightX,
            bottomRightY: b.bottomRightY,
          },
        },
      ];
    }),
  }));
}

/**
 * Splits the OCR pages into the two things downstream code needs:
 *
 *  - `inventory` — id + type + content only. This is all the LLM ever sees.
 *  - `geometry`  — id -> box, kept in this process and never sent anywhere.
 *
 * Block ids are `p<pageIndex>-b<blockIndex>` with both indices 0-based, so the
 * same OCR output always produces the same ids.
 */
export function buildBlockInventory(pages: RawPage[]): {
  inventory: InventoryPage[];
  geometry: Map<string, BlockGeometry>;
} {
  const geometry = new Map<string, BlockGeometry>();

  const inventory: InventoryPage[] = pages.map((page) => ({
    page: page.index + 1,
    blocks: page.blocks.map((block, b) => {
      const id = `p${page.index}-b${b}`; // deterministic, matches raw indices

      geometry.set(id, {
        page: page.index,
        pageWidth: page.dimensions.width,
        pageHeight: page.dimensions.height,
        box: block.box,
      });

      return {
        id,
        type: block.type || 'text',
        content: block.content,
      };
    }),
  }));

  return { inventory, geometry };
}
// <--------------------------------------------------------------------------------->

/** Runs Mistral OCR over an in-memory upload, a local file, or a public URL. */
export async function extractOcr(props: OcrGenerationProps): Promise<Response | ErrorResponse> {
  try {
    const { filePath, fileUrl, fileBytes, documentType } = props;

    if (!filePath && !fileUrl && !fileBytes) {
      return {
        success: false,
        message: 'No file path or url provided',
        error: {
          code: 'BAD_REQUEST',
          message: 'No file path or url provided',
        },
      };
    }

    // A URL is passed straight through; bytes and local files become data URLs.
    // The mime type has to be right: Mistral takes PDFs as `document_url` and
    // images as `image_url`, and mislabelling an image as a PDF fails.
    let url: string;
    let mimeType: string;

    if (fileUrl) {
      url = fileUrl;
      // Only the extension is available for a remote file.
      mimeType = props.mimeType ?? mimeFromPath(fileUrl.split('?')[0] ?? fileUrl);
    } else if (fileBytes) {
      mimeType = props.mimeType;
      url = `data:${mimeType};base64,${Buffer.from(fileBytes).toString('base64')}`;
    } else {
      mimeType = props.mimeType ?? mimeFromPath(filePath!);
      const bytes = await fs.readFile(filePath!);
      url = `data:${mimeType};base64,${bytes.toString('base64')}`;
    }

    const document =
      mimeType === 'application/pdf'
        ? ({ type: 'document_url', documentUrl: url } as const)
        : ({ type: 'image_url', imageUrl: url } as const);

    const ocrResponse = await getClient().ocr.process({
      model: OCR_MODEL,
      document,
      tableFormat: 'html', // default is null
      // extractHeader: False, // default is False
      // extractFooter: False, // default is False
      includeImageBase64: true,
      includeBlocks: true,
    });

    const data: OcrExtractionData = {
      pages: toRawPages(ocrResponse.pages),
      documentType,
      usageInfo: ocrResponse?.usageInfo,
    };

    return {
      success: true,
      message: 'Extraction successful',
      data,
    };
  } catch (error) {
    console.error('[ocr] extraction failed', error);
    return {
      success: false,
      message: 'Something went wrong',
      error,
    };
  }
}

export interface QuestionPaperTransformResult {
  /** The structured paper, after page normalization and offset recovery. */
  extraction: LlmQuestionPaperExtraction;
  /** Exactly what the LLM was shown. */
  inventory: InventoryPage[];
  /** Block id -> coordinates. Stays in this process; never sent to the LLM. */
  geometry: Map<string, BlockGeometry>;
  validation: ValidationReport;
  /** sha256 of the OCR text this transform was derived from. */
  fingerprint: string;
  cacheHit: boolean;
}

function messageContentToString(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((chunk) =>
        chunk && typeof chunk === 'object' && 'text' in chunk
          ? String((chunk as { text: unknown }).text)
          : '',
      )
      .join('');
  }
  return '';
}

/**
 * The prompt + schema pair for each document type.
 *
 * Declared once and used for BOTH the cache fingerprint and the LLM call, so
 * the key can never describe a different prompt from the one actually sent —
 * which is the failure the old hand-bumped version constant allowed.
 */
const QUESTION_PAPER_TRANSFORM = {
  prompt: mistraAIOcrTransformPrompt,
  schema: LlmQuestionPaperExtractionSchema,
} as const;

const ANSWER_SHEET_TRANSFORM = {
  prompt: mistraAIAnswerSheetTransformPrompt,
  schema: LlmAnswerSheetExtractionSchema,
} as const;

/**
 * Sends the inventory to the transform model and returns the parsed result.
 *
 * Generic over the schema so both document types share one implementation —
 * they differed only in which prompt and schema they passed.
 */
/**
 * Recursively drops null-valued properties.
 *
 * Under a JSON Schema response format the model fills every declared field,
 * emitting `null` for the ones it has nothing to say about — `"courseCode": null`
 * rather than omitting the key. Our schemas mark those `.optional()`, which in
 * zod means `string | undefined`, so a null fails validation and the whole
 * extraction is rejected over fields we never required.
 *
 * Stripping is safe here because no field in either Llm*Extraction schema is
 * meaningfully nullable: absent and null carry the same meaning.
 */
function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== null).map(stripNulls);
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (item === null) continue;
      out[key] = stripNulls(item);
    }
    return out;
  }
  return value;
}

/**
 * Turns an SDK failure into a message that says what actually went wrong.
 *
 * The Mistral SDK throws from its response matcher, so an HTTP error arrives as
 * a stack pointing at `matchers.js` with the status buried in a dumped Response
 * object. A 403 `tier_not_allowed` is indistinguishable from a genuine bug at a
 * glance, which is exactly the confusion this avoids.
 */
function describeSdkError(model: string, err: unknown): Error {
  const e = err as { statusCode?: number; body?: unknown };
  const status = e?.statusCode;
  const body = typeof e?.body === 'string' ? e.body : undefined;

  if (status === undefined) {
    return err instanceof Error ? err : new Error(String(err));
  }

  const hint =
    status === 403
      ? ` — set MISTRAL_TRANSFORM_MODEL to a model your key can use (mistral-medium-latest works on standard tiers)`
      : '';

  return new Error(
    `Transform model "${model}" failed with ${status}: ${body ?? '(no body)'}${hint}`,
  );
}

async function callTransformLlm<TSchema extends z.ZodType>(
  inventory: InventoryPage[],
  transform: { prompt: string; schema: TSchema },
): Promise<z.infer<TSchema>> {
  let response;
  try {
    response = await getClient().chat.parse({
      model: TRANSFORM_MODEL,
      messages: [
        { role: 'system', content: transform.prompt },
        { role: 'user', content: `Here is the OCR output: ${JSON.stringify(inventory)}` },
      ],
      responseFormat: transform.schema,
    });
  } catch (err) {
    throw describeSdkError(TRANSFORM_MODEL, err);
  }

  const message = response.choices?.[0]?.message;
  if (!message) {
    throw new Error('Transform LLM returned no choices');
  }

  // The SDK hands back `parsed` when the response satisfied the schema. Run it
  // through zod regardless, so the return type is guaranteed rather than
  // asserted and a malformed response fails loudly right here.
  const candidate = message.parsed ?? JSON.parse(messageContentToString(message.content));
  return transform.schema.parse(stripNulls(candidate)) as z.infer<TSchema>;
}

/**
 * Turns raw OCR pages into the structured question paper.
 *
 * Cached on the OCR content, never on the source document — see
 * `../cache/ocr-transform.cache.ts` for why. Both the cached and the freshly
 * transformed path run through validation, so callers always get a report.
 *
 * Throws on transport or schema failure; the route layer maps that to a response.
 */
export async function transformOcrOutput(pages: RawPage[]): Promise<QuestionPaperTransformResult> {
  const { inventory, geometry } = buildBlockInventory(pages);
  const fingerprint = fingerprintOcr(
    inventory,
    TRANSFORM_MODEL,
    'questionPaper',
    QUESTION_PAPER_TRANSFORM,
  );

  const cached = getCachedQuestionPaper(fingerprint);
  const cacheHit = cached !== undefined;

  // Clone on the way out: validation mutates the extraction in place, and the
  // cached copy must not drift with whatever a caller does to its result.
  const extraction = cacheHit
    ? structuredClone(cached)
    : await callTransformLlm(inventory, QUESTION_PAPER_TRANSFORM);

  // Idempotent — a cached extraction is already normalized, so re-running this
  // only rebuilds the report.
  const validation = validateExtraction(extraction, inventory);

  if (!cacheHit) {
    setCachedQuestionPaper(fingerprint, structuredClone(extraction));
  }

  return { extraction, inventory, geometry, validation, fingerprint, cacheHit };
}

export interface AnswerSheetTransformResult {
  /** The student's attempts, after page normalization and offset recovery. */
  extraction: LlmAnswerSheetExtraction;
  /** Exactly what the LLM was shown. */
  inventory: InventoryPage[];
  /** Block id -> coordinates. Stays in this process; never sent to the LLM. */
  geometry: Map<string, BlockGeometry>;
  validation: AnswerValidationReport;
  /**
   * One highlight band per attempt, keyed by the same attemptIds the validation
   * report uses. This is what the answers pane draws over the page.
   */
  regions: AttemptRegion[];
  /** sha256 of the OCR text this transform was derived from. */
  fingerprint: string;
  cacheHit: boolean;
}

/**
 * Turns raw OCR pages of a student's answer sheet into structured attempts.
 *
 * The LLM only records what the student wrote — it is never shown the question
 * paper and never infers question ids. Validation here is purely about OCR
 * consistency (provenance, offsets, coverage); mapping a written label like
 * "Q.4(b)" onto a questionId is a separate step.
 *
 * Cached on the OCR content under its own key, so an answer sheet and a
 * question paper that happen to OCR identically cannot serve each other's JSON.
 *
 * Throws on transport or schema failure; the route layer maps that to a response.
 */
export async function transformOcrOutputForAnswerSheet(
  pages: RawPage[],
): Promise<AnswerSheetTransformResult> {
  const { inventory, geometry } = buildBlockInventory(pages);
  const fingerprint = fingerprintOcr(
    inventory,
    TRANSFORM_MODEL,
    'answerSheet',
    ANSWER_SHEET_TRANSFORM,
  );

  const cached = getCachedAnswerSheet(fingerprint);
  const cacheHit = cached !== undefined;

  // Clone on the way out: validation mutates the extraction in place, and the
  // cached copy must not drift with whatever a caller does to its result.
  const extraction = cacheHit
    ? structuredClone(cached)
    : await callTransformLlm(inventory, ANSWER_SHEET_TRANSFORM);

  // Idempotent — a cached extraction is already normalized, so re-running this
  // only rebuilds the report.
  const validation = validateAnswerExtraction(extraction, inventory);

  // Regions are derived after validation, which is what corrects the offsets
  // the geometry is sliced by. Doing it earlier would highlight the model's
  // guessed character positions instead of the recovered ones.
  const { regions, issues } = deriveAttemptRegions(
    extraction,
    validation.sheetOrder,
    inventory,
    geometry,
  );

  // Region problems belong in the same list the UI already renders.
  validation.issues.push(...issues);
  validation.summary.hardFailures += issues.filter((i) => i.severity === 'error').length;
  validation.summary.warnings += issues.filter((i) => i.severity === 'warning').length;

  if (!cacheHit) {
    setCachedAnswerSheet(fingerprint, structuredClone(extraction));
  }

  return { extraction, inventory, geometry, validation, regions, fingerprint, cacheHit };
}

export interface AnswerMappingResult {
  resolution: AnswerResolutionReport;
  /**
   * questionId -> the attempts and rectangles that answer it. This is what the
   * screen needs: click a question, look it up here, draw `region.rects`.
   */
  byQuestionId: Map<string, QuestionAnswer>;
}

/**
 * Joins a transformed answer sheet to a transformed question paper.
 *
 * Deliberately not folded into `transformOcrOutputForAnswerSheet`: that result
 * is cached on OCR content alone, and resolution depends on the paper, which is
 * not part of that key. Keeping it out here means a cached sheet is never
 * served with a mapping built against a different paper.
 */
export function mapAnswersToQuestions(
  answer: AnswerSheetTransformResult,
  paper: LlmQuestionPaperExtraction,
): AnswerMappingResult {
  const resolution = resolveAnswerSheet(answer.extraction, answer.validation.sheetOrder, paper);
  const byQuestionId = buildQuestionAnswerIndex(
    resolution,
    answer.regions,
    buildPaperLabelIndex(paper),
  );

  return { resolution, byQuestionId };
}

// ============================================================
// AI marking
// ============================================================
//
// The third LLM call in the pipeline, and the smallest. The two transforms
// above restructure a whole document; this one is shown question/answer pairs
// and returns a number for each, which is why it runs on a small model.
//
// It is the only optional step. Mapping and highlighting are the feature; a
// score sits on top, so a marking failure degrades to "not marked" rather than
// failing the upload.

/** Overridable per environment, like the other two models. */
export const MARKING_MODEL = process.env.MISTRAL_MARKING_MODEL ?? 'mistral-small-latest';

/**
 * How many answers go into one call.
 *
 * Not one call per question: the system prompt is re-sent every time, so a
 * 30-question paper would pay for it thirty times over and take thirty chances
 * on a rate limit. Not one call for the whole paper either — a small model
 * marking an unbounded list starts dropping and transposing entries, and a
 * single failure would leave the entire paper unmarked.
 *
 * Twelve means a typical paper is a single call, a long one is a handful, and
 * each call stays short enough to stay accurate.
 */
const QUESTIONS_PER_CALL = 12;

/** Batches in flight at once. Papers rarely need more than a few. */
const MARKING_CONCURRENCY = 3;

/**
 * The response: one entry per item, each echoing the ref it was given.
 *
 * `ref` is what makes the join safe. Scores are matched back by it rather than
 * by array position, so a model that drops or reorders an entry costs us that
 * one mark instead of silently shifting every later score onto the wrong
 * question.
 */
const MarkedAnswersSchema = z.object({
  marks: z.array(
    z.object({
      ref: z.number(),
      awardedMarks: z.number(),
    }),
  ),
});

const ANSWER_MARKING = {
  prompt: mistraAIAnswerMarkingPrompt,
  schema: MarkedAnswersSchema,
} as const;

/** One question, its worth, and what the student actually wrote about it. */
export interface AnswerToMark {
  questionId: string;
  questionText: string;
  maxMarks: number;
  /** The answer as transcribed — every attempt that resolved to this question. */
  answerText: string;
}

export interface AnswerMarkingResult {
  /** questionId -> awarded marks. A question absent here was not marked. */
  byQuestionId: Map<string, number>;
  /** Questions sent to the model that came back without a usable score. */
  unmarked: string[];
  /** Recorded so the payload can say what produced the numbers. */
  model: string;
}

/**
 * Forces a raw model score into a mark a teacher could actually be shown.
 *
 * The schema can say "a number"; it cannot say "a whole number within this
 * particular question's maximum". Models do return 7 out of 5, negatives and
 * half marks, and any of those rendered beside a student's name would be
 * nonsense — so the range is imposed here rather than trusted.
 *
 * Returns null for a score that cannot be salvaged, which the caller treats as
 * unmarked rather than as a zero.
 */
export function clampMarks(raw: number, maxMarks: number): number | null {
  if (!Number.isFinite(raw)) return null;
  return Math.max(0, Math.min(maxMarks, Math.round(raw)));
}

/** Splits a list into consecutive runs of at most `size`. */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Marks one batch of answers.
 *
 * Returns only the entries that came back cleanly and matched a ref we issued;
 * anything else is simply absent, and the caller reports it as unmarked.
 */
async function markBatch(batch: AnswerToMark[]): Promise<Map<string, number>> {
  // Refs are positions within this batch, so they stay small however long the
  // paper is. The model never sees a questionId.
  const byRef = new Map(batch.map((item, index) => [index + 1, item]));

  const items = batch.map((item, index) => ({
    ref: index + 1,
    question: item.questionText,
    maxMarks: item.maxMarks,
    answer: item.answerText,
  }));

  let response;
  try {
    response = await getClient().chat.parse({
      model: MARKING_MODEL,
      messages: [
        { role: 'system', content: ANSWER_MARKING.prompt },
        { role: 'user', content: `Mark these ${items.length} items: ${JSON.stringify(items)}` },
      ],
      responseFormat: ANSWER_MARKING.schema,
      // Marking the same script twice should not produce two different totals.
      temperature: 0,
    });
  } catch (err) {
    throw describeSdkError(MARKING_MODEL, err);
  }

  const message = response.choices?.[0]?.message;
  if (!message) {
    throw new Error('Marking LLM returned no choices');
  }

  const candidate = message.parsed ?? JSON.parse(messageContentToString(message.content));
  const { marks } = ANSWER_MARKING.schema.parse(stripNulls(candidate));

  return joinScores(byRef, marks);
}

/**
 * Matches returned scores back onto the questions they belong to.
 *
 * The whole reason marking batches at all safely. The model is asked for one
 * entry per item, but a small model will sometimes drop one, repeat one, or
 * hand them back out of order. Matching on the echoed `ref` rather than on
 * array position means every one of those costs a single mark, where zipping by
 * index would shift every later score onto the wrong question - wrong marks
 * that look entirely plausible.
 *
 * Anything that cannot be matched with certainty is left out, and the caller
 * reports that question as unmarked.
 */
export function joinScores(
  byRef: Map<number, AnswerToMark>,
  entries: Array<{ ref: number; awardedMarks: number }>,
): Map<string, number> {
  const scored = new Map<string, number>();

  for (const entry of entries) {
    const item = byRef.get(entry.ref);
    // A ref we never issued, or one already answered: drop it rather than guess
    // which question it belongs to.
    if (item === undefined || scored.has(item.questionId)) continue;

    const value = clampMarks(entry.awardedMarks, item.maxMarks);
    if (value !== null) scored.set(item.questionId, value);
  }

  return scored;
}

/**
 * Marks every answer, a batch at a time.
 *
 * Never throws. A batch that fails, or an entry the model drops, leaves those
 * questions unmarked — which the UI shows as a dash. That is the honest
 * outcome: the alternative is either failing an upload whose mapping is
 * perfectly good, or inventing numbers to fill the gaps.
 */
export async function markAnswers(items: AnswerToMark[]): Promise<AnswerMarkingResult> {
  const byQuestionId = new Map<string, number>();
  const batches = chunk(items, QUESTIONS_PER_CALL);

  let cursor = 0;
  // build batches and loop over them
  const worker = async (): Promise<void> => {
    for (;;) {
      const index = cursor++;
      const batch = batches[index];
      if (batch === undefined) return;

      try {
        for (const [questionId, marks] of await markBatch(batch)) {
          byQuestionId.set(questionId, marks);
        }
      } catch (err) {
        const label = `batch ${index + 1}/${batches.length}`;
        console.warn(`[marking] ${label} failed:`, (err as Error).message);
      }
    }
  };

  // resolve multiple batch calls in parallel
  await Promise.all(
    Array.from({ length: Math.min(MARKING_CONCURRENCY, batches.length) }, () => worker()),
  );

  const unmarked = items
    .filter((item) => !byQuestionId.has(item.questionId))
    .map((item) => item.questionId);

  return { byQuestionId, unmarked, model: MARKING_MODEL };
}

/**
 * Works out which questions can be marked, and gathers the text for each.
 *
 * Three kinds of question are left out, none of them a failure — all three end
 * up showing a dash rather than a score:
 *
 *  - nothing on the sheet resolved to it, so there is no answer to judge;
 *  - the paper states no marks for it, so there is no maximum to score against;
 *  - the resolved attempts carry no readable text.
 *
 * An answer split across a page break resolves to several attempts; they are
 * joined in sheet order so the model marks the whole answer rather than the
 * fragment that happened to come first.
 */
export function collectAnswersToMark(
  paper: LlmQuestionPaperExtraction,
  answer: AnswerSheetTransformResult,
  mapping: AnswerMappingResult,
): AnswerToMark[] {
  const textByAttemptId = new Map<string, string>();
  for (const position of answer.validation.sheetOrder) {
    const attempt = answer.extraction.attempts[position.index];
    if (attempt !== undefined) textByAttemptId.set(position.attemptId, attempt.text);
  }

  const items: AnswerToMark[] = [];

  for (const section of paper.sections) {
    for (const question of section.questions) {
      const questionId = `${section.sectionId}.${question.displayLabel}`;
      const resolved = mapping.byQuestionId.get(questionId);

      const maxMarks = question.marks ?? section.marksPerQuestion;
      if (resolved === undefined || maxMarks === undefined || maxMarks <= 0) continue;

      const answerText = resolved.attemptIds
        .map((attemptId) => textByAttemptId.get(attemptId) ?? '')
        .join('\n')
        .trim();

      if (answerText === '') continue;

      // Parts belong to the question the student had to answer, so the model
      // sees them too — marking "Q3" without its (a) and (b) would be marking a
      // different question from the one on the paper.
      const parts = (question.parts ?? []).map((part) => `${part.label} ${part.text}`);
      const questionText = [question.text, ...parts].join('\n');

      items.push({ questionId, questionText, maxMarks, answerText });
    }
  }

  return items;
}
