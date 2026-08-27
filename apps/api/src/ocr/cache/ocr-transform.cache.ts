import { createHash } from 'node:crypto';
import type { InventoryPage, LlmQuestionPaperExtraction } from '@vedaai/shared';

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

/**
 * Bumped whenever the prompt or the shape of the extraction changes.
 *
 * It is folded into the fingerprint so that a prompt edit cannot serve stale
 * JSON produced by the previous prompt against identical OCR text.
 */
export const EXTRACTION_VERSION = '1';

const transformCache = new MemoryCache<LlmQuestionPaperExtraction>(50);

/**
 * Fingerprints exactly what the LLM is shown — block ids, types and content,
 * in order — plus the extraction version.
 *
 * Geometry is intentionally excluded: coordinates never reach the LLM, so they
 * cannot influence the transformed JSON and must not influence the cache key.
 */
export function fingerprintOcr(inventory: InventoryPage[], model: string): string {
  const canonical = JSON.stringify({
    v: EXTRACTION_VERSION,
    model,
    pages: inventory.map((page) => ({
      page: page.page,
      blocks: page.blocks.map((block) => [block.id, block.type, block.content]),
    })),
  });

  return createHash('sha256').update(canonical).digest('hex');
}

export function getCachedTransform(fingerprint: string): LlmQuestionPaperExtraction | undefined {
  return transformCache.get(fingerprint);
}

export function setCachedTransform(
  fingerprint: string,
  extraction: LlmQuestionPaperExtraction,
): void {
  transformCache.set(fingerprint, extraction);
}

export function clearTransformCache(): void {
  transformCache.clear();
}

export function transformCacheStats(): CacheStats {
  return transformCache.stats;
}
