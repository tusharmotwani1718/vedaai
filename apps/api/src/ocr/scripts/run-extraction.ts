/**
 * Dev script: run the question-paper pipeline end to end against a local PDF.
 *
 *   bun run extraction                    # uses public/pdf/rtu-paper.pdf
 *   bun run extraction path/to/paper.pdf
 *
 * This is a harness for eyeballing OCR + transform quality, not part of the
 * server. Run it twice on the same input to see the OCR->JSON cache hit.
 */
import path from 'node:path';

import { extractOcr, transformOcrOutput, type OcrExtractionData } from '../utils/extraction';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../../..');
const DEFAULT_PDF = path.join(REPO_ROOT, 'public/pdf/rtu-paper.pdf');

const filePath = process.argv[2] ?? DEFAULT_PDF;

console.log(`[extraction] OCR on ${filePath}`);
const ocr = await extractOcr({ filePath, documentType: 'questionPaper' });

if (!ocr.success) {
  console.error('[extraction] OCR failed:', ocr.message, ocr.error);
  process.exit(1);
}

const { pages } = ocr.data as OcrExtractionData;
const blockCount = pages.reduce((n, page) => n + page.blocks.length, 0);
console.log(`[extraction] ${pages.length} page(s), ${blockCount} block(s)`);

console.log('[extraction] transforming…');
const result = await transformOcrOutput(pages);

console.log(
  `[extraction] ${result.cacheHit ? 'CACHE HIT' : 'fresh transform'} — fingerprint ${result.fingerprint.slice(0, 12)}…`,
);

const { summary, structure, blockExistence, reconstruction, pageNormalization } = result.validation;
console.log(
  `[extraction] validation: ${summary.hardFailures} hard failure(s), ${summary.warnings} warning(s)`,
);

// Only the failures are worth printing — a clean run should stay quiet.
for (const r of pageNormalization.filter((r) => !r.ok)) {
  console.warn(`  page?  ${r.questionId}: malformed block id ${r.blockId}`);
}
for (const r of blockExistence.filter((r) => !r.ok)) {
  console.warn(`  block  ${r.questionId}: ${r.blockId} not in inventory`);
}
for (const r of reconstruction.filter((r) => !r.ok)) {
  console.warn(`  text   ${r.questionId}: ${r.reason}`);
}
for (const r of structure.filter((r) => !r.ok)) {
  console.warn(`  struct ${r.scope}: ${r.reason}`);
}

console.log(JSON.stringify(result.extraction, null, 2));
