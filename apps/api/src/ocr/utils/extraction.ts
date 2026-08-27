import fs from 'node:fs/promises';

import { Mistral } from '@mistralai/mistralai';
import type { OCRPageObject } from '@mistralai/mistralai/models/components';
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
import { mistraAIAnswerSheetTransformPrompt, mistraAIOcrTransformPrompt } from '../lib/constants';
import {
  validateAnswerExtraction,
  type AnswerValidationReport,
} from '../lib/validators/validate.answer-extraction';
import {
  validateExtraction,
  type ValidationReport,
} from '../lib/validators/validate.question-extraction';

export const OCR_MODEL = 'mistral-ocr-latest';
export const TRANSFORM_MODEL = 'mistral-large-latest';

export type OcrGenerationProps =
  | {
      fileUrl: string; // for cloud docs
      filePath?: never; // for local docs
      documentType: TransformDocumentType;
    }
  | {
      fileUrl?: never;
      filePath: string;
      documentType: TransformDocumentType;
    };

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

/** Runs Mistral OCR over a local file or a publicly reachable URL. */
export async function extractOcr(props: OcrGenerationProps): Promise<Response | ErrorResponse> {
  try {
    const { filePath, fileUrl, documentType } = props;

    if (!filePath && !fileUrl) {
      return {
        success: false,
        message: 'No file path or url provided',
        error: {
          code: 'BAD_REQUEST',
          message: 'No file path or url provided',
        },
      };
    }

    let documentUrl = fileUrl;
    if (!documentUrl && filePath) {
      const pdfBuffer = await fs.readFile(filePath);
      documentUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    }

    const ocrResponse = await getClient().ocr.process({
      model: OCR_MODEL,
      document: {
        type: 'document_url',
        documentUrl: documentUrl as string,
      },
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

async function callTransformLlm(inventory: InventoryPage[]): Promise<LlmQuestionPaperExtraction> {
  const response = await getClient().chat.parse({
    model: TRANSFORM_MODEL,
    messages: [
      { role: 'system', content: mistraAIOcrTransformPrompt },
      { role: 'user', content: `Here is the OCR output: ${JSON.stringify(inventory)}` },
    ],
    responseFormat: LlmQuestionPaperExtractionSchema,
  });

  const message = response.choices?.[0]?.message;
  if (!message) {
    throw new Error('Transform LLM returned no choices');
  }

  // The SDK hands back `parsed` when the response satisfied the schema. Run it
  // through zod regardless, so the return type is guaranteed rather than
  // asserted and a malformed response fails loudly right here.
  const candidate = message.parsed ?? JSON.parse(messageContentToString(message.content));
  return LlmQuestionPaperExtractionSchema.parse(candidate);
}

async function callTransformLlmForAnswerSheet(
  inventory: InventoryPage[],
): Promise<LlmAnswerSheetExtraction> {
  const response = await getClient().chat.parse({
    model: TRANSFORM_MODEL,
    messages: [
      { role: 'system', content: mistraAIAnswerSheetTransformPrompt },
      { role: 'user', content: `Here is the OCR output: ${JSON.stringify(inventory)}` },
    ],
    responseFormat: LlmAnswerSheetExtractionSchema,
  });

  const message = response.choices?.[0]?.message;
  if (!message) {
    throw new Error('Transform LLM returned no choices');
  }

  // The SDK hands back `parsed` when the response satisfied the schema. Run it
  // through zod regardless, so the return type is guaranteed rather than
  // asserted and a malformed response fails loudly right here.
  const candidate = message.parsed ?? JSON.parse(messageContentToString(message.content));
  return LlmAnswerSheetExtractionSchema.parse(candidate);
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
  const fingerprint = fingerprintOcr(inventory, TRANSFORM_MODEL, 'questionPaper');

  const cached = getCachedQuestionPaper(fingerprint);
  const cacheHit = cached !== undefined;

  // Clone on the way out: validation mutates the extraction in place, and the
  // cached copy must not drift with whatever a caller does to its result.
  const extraction = cacheHit ? structuredClone(cached) : await callTransformLlm(inventory);

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
  const fingerprint = fingerprintOcr(inventory, TRANSFORM_MODEL, 'answerSheet');

  const cached = getCachedAnswerSheet(fingerprint);
  const cacheHit = cached !== undefined;

  // Clone on the way out: validation mutates the extraction in place, and the
  // cached copy must not drift with whatever a caller does to its result.
  const extraction = cacheHit
    ? structuredClone(cached)
    : await callTransformLlmForAnswerSheet(inventory);

  // Idempotent — a cached extraction is already normalized, so re-running this
  // only rebuilds the report.
  const validation = validateAnswerExtraction(extraction, inventory);

  if (!cacheHit) {
    setCachedAnswerSheet(fingerprint, structuredClone(extraction));
  }

  return { extraction, inventory, geometry, validation, fingerprint, cacheHit };
}
