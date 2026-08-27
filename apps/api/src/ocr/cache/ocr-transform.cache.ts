import { createHash } from 'node:crypto';
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
 * Bumped whenever a prompt or the shape of an extraction changes.
 *
 * It is folded into the fingerprint so that a prompt edit cannot serve stale
 * JSON produced by the previous prompt against identical OCR text.
 */
export const EXTRACTION_VERSION = '1';

// Two documents, two prompts, two schemas — so two stores. Keeping them apart
// is what makes the accessors type-safe; the document type is also folded into
// the fingerprint so a key can never be read from the wrong store by accident.
const questionPaperCache = new MemoryCache<LlmQuestionPaperExtraction>(50);
const answerSheetCache = new MemoryCache<LlmAnswerSheetExtraction>(50);

/**
 * Fingerprints exactly what the LLM is shown — block ids, types and content, in
 * order — plus the model, the extraction version, and which document type is
 * being transformed.
 *
 * The document type matters: the same OCR text run through the question-paper
 * prompt and the answer-sheet prompt yields two completely different JSON
 * shapes. Without it in the key, those two transforms collide.
 *
 * Geometry is intentionally excluded: coordinates never reach the LLM, so they
 * cannot influence the transformed JSON and must not influence the cache key.
 */
export function fingerprintOcr(
  inventory: InventoryPage[],
  model: string,
  documentType: TransformDocumentType,
): string {
  const canonical = JSON.stringify({
    v: EXTRACTION_VERSION,
    model,
    documentType,
    pages: inventory.map((page) => ({
      page: page.page,
      blocks: page.blocks.map((block) => [block.id, block.type, block.content]),
    })),
  });

  return createHash('sha256').update(canonical).digest('hex');
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
