import { randomUUID } from 'node:crypto';

import type { DocumentKind } from '@vedaai/shared';

import { MemoryCache, type CacheStats } from '../lib/memory-cache';
import type {
  AnswerMappingResult,
  AnswerMarkingResult,
  AnswerSheetTransformResult,
  QuestionPaperTransformResult,
} from '../ocr/utils/extraction';

/**
 * The in-memory home for a processed question paper + answer sheet pair.
 *
 * There is no database (see `specs/00_Technical_requirements.md`), so an
 * evaluation lives only in this process and disappears on restart. The original
 * upload bytes are kept alongside the extraction because the answers pane
 * renders the actual document, not a reconstruction of it.
 */

export type { DocumentKind };

export interface StoredDocument {
  bytes: Buffer;
  mimeType: string;
  fileName: string;
  /** Page geometry from OCR, so the UI can size its highlight overlay. */
  pages: Array<{ index: number; width: number; height: number }>;
}

// single evaluation contains both: question-paper (uploaded + transformed) and answer-sheet (uploaded + transformed).
export interface Evaluation {
  id: string;
  createdAt: string;
  questionPaper: {
    document: StoredDocument; // uploaded question paper.
    result: QuestionPaperTransformResult; // transformed result after llm, ocr, validations and geometry
  };
  answerSheet: {
    document: StoredDocument; // uploaded answer sheet.
    result: AnswerSheetTransformResult; // transformed result after llm, ocr, validations and geometry
  };
  mapping: AnswerMappingResult; // mapping of question-answers
  marking: AnswerMarkingResult; // ai-awarded marks, keyed by questionId
}

/**
 * Bounded deliberately: each evaluation holds two whole documents in memory, so
 * an unbounded store would be a slow leak. Ten is plenty for a single-user demo
 * and the oldest is evicted first.
 */
const evaluations = new MemoryCache<Evaluation>(10);

export function createEvaluation(input: Omit<Evaluation, 'id' | 'createdAt'>): Evaluation {
  const evaluation: Evaluation = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };

  evaluations.set(evaluation.id, evaluation);
  return evaluation;
}

export function getEvaluation(id: string): Evaluation | undefined {
  return evaluations.get(id);
}

export function documentOf(evaluation: Evaluation, kind: DocumentKind): StoredDocument {
  return kind === 'question-paper'
    ? evaluation.questionPaper.document
    : evaluation.answerSheet.document;
}

export function evaluationStoreStats(): CacheStats {
  return evaluations.stats;
}

export function clearEvaluations(): void {
  evaluations.clear();
}
