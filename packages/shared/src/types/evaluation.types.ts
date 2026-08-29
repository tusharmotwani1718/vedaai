/**
 * ============================================================
 * THE WIRE CONTRACT — what `/api/evaluations` puts on the network
 * ============================================================
 *
 * A third shape, alongside the two in `ocr.types.ts`. The stored types there
 * hold `Map`s and pixel-space geometry, neither of which survives
 * `JSON.stringify`; these are what is actually sent, and the only shapes the
 * frontend ever sees.
 *
 * `evaluation.payload.ts` in the API is the single place that converts one into
 * the other. Everything here must be JSON-safe: plain objects, no `Map`, no
 * `Buffer`, no `Date`.
 */

import type { Region, ResolutionMethod } from './ocr.types';

/** Which of the two uploads a document endpoint refers to. */
export type DocumentKind = 'question-paper' | 'answer-sheet';

export type IssueSeverity = 'error' | 'warning';

/** One thing a validator flagged, in a form the UI can group or filter. */
export interface AnswerValidationIssue {
  severity: IssueSeverity;
  /** Stable machine-readable code, so the UI can group or filter. */
  code: string;
  /** What the issue is about: "attempt a3", "block p1-b4", "section A". */
  scope: string;
  message: string;
}

/**
 * Closes the loop: what answers a question, and where to draw the highlight.
 *
 * This is what the answers pane consumes. Click a question in the list, look it
 * up in `EvaluationPayload.mapping`, draw `region.rects` over the page.
 */
export interface QuestionAnswer {
  questionId: string;
  /** Contributing attemptIds, in sheet order. More than one when continued. */
  attemptIds: string[];
  /**
   * Every rectangle to highlight for this question, in sheet order. Rects from
   * a continuation follow the ones from the original, so a page-spanning answer
   * highlights as a whole.
   */
  region: Region;
  /** Lowest confidence among the contributing attempts. */
  confidence: number;
  method: ResolutionMethod;
}

export interface QuestionPayload {
  /** Stable id the mapping is keyed by, e.g. "A.3". */
  questionId: string;
  displayLabel: string;
  text: string;
  marks?: number;
  parts: Array<{ partId: string; label: string; text: string; marks?: number }>;
  isOptionalWith: string[];
  /** Whether any attempt resolved to this question. */
  answered: boolean;
}

export interface SectionPayload {
  sectionId: string;
  displayName: string;
  description?: string;
  totalQuestions: number;
  attemptCount: number;
  marksPerQuestion?: number;
  sectionTotal?: number;
  rawMarksExpression?: string;
  constraints?: string;
  questions: QuestionPayload[];
}

export interface AttemptPayload {
  attemptId: string;
  orderOnSheet: number;
  claimedLabel: string;
  text: string;
  hasDiagram: boolean;
  isContinuation: boolean;
  continuesFrom: string | null;
  resolvedQuestionId: string | null;
  resolutionConfidence: number;
  /** Where to draw this attempt's highlight. */
  region: Region;
}

export interface DocumentPayload {
  kind: DocumentKind;
  fileName: string;
  mimeType: string;
  pageCount: number;
  pages: Array<{ index: number; width: number; height: number }>;
  /**
   * Path — not an absolute URL — where the original bytes live. The client
   * joins it onto its own API base, since the API does not know what host it is
   * being reached on.
   */
  url: string;
}

export interface EvaluationPayload {
  evaluationId: string;
  createdAt: string;
  paper: {
    metadata: Record<string, unknown>;
    rawInstructions?: string;
    sections: SectionPayload[];
    maxMarks?: number;
  };
  answerSheet: {
    attempts: AttemptPayload[];
    unattemptedQuestions: string[];
  };
  /**
   * questionId -> what answers it, and the rectangles to highlight.
   * `Object.fromEntries` of the internal Map.
   */
  mapping: Record<string, QuestionAnswer>;
  issues: {
    questionPaper: Array<{ scope: string; ok: boolean; reason?: string }>;
    answerSheet: AnswerValidationIssue[];
    resolution: AnswerValidationIssue[];
  };
  summary: {
    questionPaper: { hardFailures: number; warnings: number };
    answerSheet: { hardFailures: number; warnings: number };
    resolution: { resolved: number; unresolved: number };
  };
  documents: DocumentPayload[];
}
