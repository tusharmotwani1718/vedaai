/**
 * ============================================================
 * SCHEMA LAYERING — read this before editing anything below
 * ============================================================
 *
 * Every document has TWO shapes:
 *
 *  1. Llm*Extraction  — what the LLM is asked to return.
 *     It only ever sees OCR text + block ids. It NEVER emits
 *     coordinates, confidence scores, or resolved ids. If you
 *     add a field here that requires geometry or cross-referencing,
 *     the model will hallucinate it.
 *
 *  2. The stored type (QuestionPaper / AnswerSheet, etc.)
 *     — produced by YOUR code after taking the Llm* output,
 *     deriving regions from OCR block boxes, running validators,
 *     and computing confidence. This is what you persist and
 *     what the frontend renders.
 *
 * Never let a coordinate or a confidence score originate on the
 * LLM side of this boundary.
 */

// ============================================================
// Shared primitives
// ============================================================

/** Normalized rectangle — all values are fractions (0–1) of page width/height. */
export interface RectArea {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** A RectArea anchored to a specific page (0-indexed). */
export interface PageRect extends RectArea {
  page: number;
}

/**
 * A region on the document. Deliberately a LIST of per-page rects —
 * a single logical unit (an answer, occasionally a question) can
 * span a page break. Render as one RectArea per page it touches.
 */
export interface Region {
  rects: PageRect[];
}

/** Where a piece of extracted text came from, for verification against raw OCR. */
export interface TextOrigin {
  page: number;
  blockId: string;
  /** Char offsets into that block's raw OCR content. Used to verify
   *  the LLM didn't paraphrase: rawBlock.slice(charStart, charEnd) === text */
  charStart: number;
  charEnd: number;
}

/** Result of running validators against an extracted unit. */
export interface Confidence {
  /** 0–1 composite score. */
  score: number;
  /** Per-check scores, e.g. { reconstruction: 1, coverage: 0.95, geometricResidual: 0.98 } */
  checks: Record<string, number>;
  /** Human-readable reasons this needs review, e.g. "coverage below threshold" */
  flags: string[];
}

export interface Figure {
  figureId: string;
  region: Region;
  /** Reference to stored image bytes — file path, blob key, or base64 for small crops. */
  imageRef: string;
  caption?: string;
}

/** Page dimensions as returned by the OCR/parse step, for denormalizing rects. */
export interface PageDimensions {
  page: number;
  width: number;
  height: number;
  dpi?: number;
}

// ============================================================
// LLM extraction output — QUESTION PAPER
// ============================================================

export interface LlmQuestionPart {
  label: string; // "a", "b", "i"
  text: string;
  marks?: number;
  TextOrigin: TextOrigin;
}

export interface LlmExtractedQuestion {
  displayLabel: string; // "1", "3(a)" — as printed
  sectionId: string; // must match a section's sectionId below
  orderInSection: number;
  text: string;
  marks?: number;
  parts?: LlmQuestionPart[];
  /** displayLabels of alternative questions, e.g. ["4"] for "Q3 OR Q4" */
  isOptionalWith?: string[];
  TextOrigin: TextOrigin;
  /** Model's own flags, e.g. "marks not clearly printed on this line" */
  uncertainties?: string[];
}

export interface LlmExtractedSection {
  sectionId: string; // "A", "B", "C"
  displayName: string; // "PART-A"
  description?: string; // "(Analytical/Problem solving questions)"
  totalQuestions: number;
  /** How many the student must attempt — the single most important field here. */
  attemptCount: number;
  marksPerQuestion?: number;
  sectionTotal?: number;
  /** e.g. "(10×2=20)" — kept verbatim as a checksum for validation. */
  rawMarksExpression?: string;
  /** e.g. "Answer should be given up to 25 words only" */
  constraints?: string;
  questions: LlmExtractedQuestion[];
}

export interface LlmQuestionPaperExtraction {
  metadata: {
    title?: string;
    courseCode?: string; // "6AID4-06"
    examCode?: string; // "6E7106"
    institution?: string;
    session?: string; // "April/May - 2026"
    durationMinutes?: number;
    maxMarks?: number;
  };
  /** Verbatim instructions block — kept in full even after parsing attempt rules out of it. */
  rawInstructions?: string;
  sections: LlmExtractedSection[];
  uncertainties?: string[];
}

// ============================================================
// Stored / enriched — QUESTION PAPER
// ============================================================

export interface QuestionPart {
  partId: string; // "B.5.a"
  label: string;
  text: string;
  marks?: number;
  TextOrigin: TextOrigin;
  region: Region;
  confidence: Confidence;
}

export interface Question {
  /** Stable composite key. Never a bare number — "1" collides across sections. */
  questionId: string; // "A.1", "B.3"
  displayLabel: string;
  sectionId: string;
  orderInSection: number;
  text: string;
  marks?: number;
  parts: QuestionPart[];
  /** Resolved questionIds, e.g. ["B.4"] */
  isOptionalWith: string[];
  figures: Figure[];
  TextOrigin: TextOrigin;
  region: Region;
  confidence: Confidence;
}

export interface Section {
  sectionId: string;
  displayName: string;
  description?: string;
  totalQuestions: number;
  attemptCount: number;
  marksPerQuestion?: number;
  sectionTotal?: number;
  rawMarksExpression?: string;
  constraints?: string;
  questions: Question[];
}

export interface QuestionPaper {
  paperId: string;
  sourceFileHash: string;
  schemaVersion: string;
  extractionVersion: string; // ties a stored paper to the prompt/logic version that produced it
  extractedAt: string; // ISO timestamp
  pageCount: number;
  pageDimensions: PageDimensions[];
  metadata: LlmQuestionPaperExtraction["metadata"];
  rawInstructions?: string;
  sections: Section[];
  /** Document-level uncertainties, merged from the LLM output and your own validators. */
  uncertainties: string[];
}

