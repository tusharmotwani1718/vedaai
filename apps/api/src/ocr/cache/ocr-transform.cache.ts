import { createHash } from 'node:crypto';
import { z } from 'zod';
import type {
  InventoryPage,
  LlmAnswerSheetExtraction,
  LlmQuestionPaperExtraction,
} from '@vedaai/shared';

import { MemoryCache, type CacheStats } from '../../lib/memory-cache';

/**
 * Cache for the pair **(generated OCR -> transformed JSON)**.
 *
 * Read `specs/01_feature_overview.md` before changing the key: the cache is
 * deliberately NOT keyed on the uploaded document. Mistral OCR can return
 * different output for the same PDF across runs, so a document-keyed cache
 * would happily serve a JSON transform that no longer matches the OCR text the
 * offsets and block ids point into.
 *
 * Keying on the OCR content instead makes invalidation automatic: re-running
 * OCR on the same paper produces different text -> a different fingerprint ->
 * a miss. Nothing has to be explicitly evicted for correctness.
 */

/** Which prompt + schema a transform was produced with. */
export type TransformDocumentType = 'questionPaper' | 'answerSheet';

/**
 * Everything besides the OCR text that determines what the LLM returns.
 *
 * Passed as one object so the fingerprint is computed from the *same* prompt
 * and schema that are actually sent to the model — keeping them together makes
 * it impossible for the key to describe one prompt while the call uses another.
 */
export interface TransformIdentity {
  /** The exact system prompt sent to the model. */
  prompt: string;
  /** The response schema the model is constrained to. */
  schema: z.ZodType;
}

// Two documents, two prompts, two schemas — so two stores. Keeping them apart
// is what makes the accessors type-safe; the document type is also folded into
// the fingerprint so a key can never be read from the wrong store by accident.
const questionPaperCache = new MemoryCache<LlmQuestionPaperExtraction>(50);
const answerSheetCache = new MemoryCache<LlmAnswerSheetExtraction>(50);

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Fingerprints the response schema via its JSON Schema projection.
 *
 * A schema change alters the shape of the cached object even when the prompt is
 * untouched — adding a required field, say — and a cached entry is never
 * re-parsed, so without this an old object could be served against a new schema.
 */
function schemaFingerprint(schema: z.ZodType): string {
  try {
    return sha256(JSON.stringify(z.toJSONSchema(schema)));
  } catch {
    // Some future schema construct may not project to JSON Schema. Degrade to a
    // constant rather than throwing: the cache keeps working, at the cost of not
    // noticing schema-only edits.
    return 'schema-unavailable';
  }
}

/**
 * Fingerprints exactly what the LLM is shown — block ids, types and content, in
 * order — plus everything else that determines its answer: the model, the
 * document type, and hashes of the prompt and response schema.
 *
 * The prompt and schema are hashed rather than version-stamped by hand. An
 * earlier version of this used a manually bumped `EXTRACTION_VERSION` constant,
 * which is only as reliable as remembering to bump it — and it was not bumped
 * across two prompt edits. Hashing the real inputs cannot be forgotten.
 *
 * The document type matters for the same reason: the same OCR text run through
 * the question-paper prompt and the answer-sheet prompt yields two completely
 * different JSON shapes. Without it in the key, those two transforms collide.
 *
 * Geometry is intentionally excluded: coordinates never reach the LLM, so they
 * cannot influence the transformed JSON and must not influence the cache key.
 */
export function fingerprintOcr(
  inventory: InventoryPage[],
  model: string,
  documentType: TransformDocumentType,
  transform: TransformIdentity,
): string {
  const canonical = JSON.stringify({
    model,
    documentType,
    // Hashed, not inlined: the prompt is several KB and only its identity matters.
    prompt: sha256(transform.prompt),
    schema: schemaFingerprint(transform.schema),
    pages: inventory.map((page) => ({
      page: page.page,
      blocks: page.blocks.map((block) => [block.id, block.type, block.content]),
    })),
  });

  return sha256(canonical);
}

export function getCachedQuestionPaper(
  fingerprint: string,
): LlmQuestionPaperExtraction | undefined {
  return questionPaperCache.get(fingerprint);
}

export function setCachedQuestionPaper(
  fingerprint: string,
  extraction: LlmQuestionPaperExtraction,
): void {
  questionPaperCache.set(fingerprint, extraction);
}

export function getCachedAnswerSheet(fingerprint: string): LlmAnswerSheetExtraction | undefined {
  return answerSheetCache.get(fingerprint);
}

export function setCachedAnswerSheet(
  fingerprint: string,
  extraction: LlmAnswerSheetExtraction,
): void {
  answerSheetCache.set(fingerprint, extraction);
}

export function clearTransformCache(): void {
  questionPaperCache.clear();
  answerSheetCache.clear();
}

export function transformCacheStats(): Record<TransformDocumentType, CacheStats> {
  return {
    questionPaper: questionPaperCache.stats,
    answerSheet: answerSheetCache.stats,
  };
}
