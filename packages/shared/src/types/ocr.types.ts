/**
 * ============================================================
 * SCHEMA LAYERING — read this before editing anything below
 * ============================================================
 *
 * Every document has TWO shapes:
 *
 *  1. Llm*Extraction  — what the LLM is asked to return.
 *     It only ever sees OCR text + block ids. It NEVER emits
 *     coordinates, confidence scores, or resolved ids. If we
 *     add a field here that requires geometry or cross-referencing,
 *     the model will hallucinate it.
 *
 *  2. The stored type (QuestionPaper / AnswerSheet, etc.)
 *     — produced by YOUR code after taking the Llm* output,
 *     deriving regions from OCR block boxes, running validators,
 *     and computing confidence. This is what we persist and
 *     what the frontend renders.
 *
 * Never let a coordinate or a confidence score originate on the
 * LLM side of this boundary.
 */

// ============================================================
// Shared primitives
// ============================================================
import { z } from "zod";

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



const textOriginSchema = z.object({
  page: z.number(),
  blockId: z.string(),
  charStart: z.number(),
  charEnd: z.number(),
});

export const LlmQuestionPartSchema = z.object({
  label: z.string(),
  text: z.string(),
  marks: z.number().optional(),
  TextOrigin: textOriginSchema,
});

export type LlmQuestionPart = z.infer<typeof LlmQuestionPartSchema>;

export const LlmExtractedQuestionSchema = z.object({
  displayLabel: z.string(),
  sectionId: z.string(),
  orderInSection: z.number(),
  text: z.string(),
  marks: z.number().optional(),
  parts: z.array(LlmQuestionPartSchema).optional(),
  isOptionalWith: z.array(z.string()).optional(),
  TextOrigin: textOriginSchema,
  uncertainties: z.array(z.string()).optional(),
});

export type LlmExtractedQuestion = z.infer<typeof LlmExtractedQuestionSchema>;

export const LlmExtractedSectionSchema = z.object({
  sectionId: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  totalQuestions: z.number(),
  attemptCount: z.number(),
  marksPerQuestion: z.number().optional(),
  sectionTotal: z.number().optional(),
  rawMarksExpression: z.string().optional(),
  constraints: z.string().optional(),
  questions: z.array(LlmExtractedQuestionSchema),
});

export type LlmExtractedSection = z.infer<typeof LlmExtractedSectionSchema>;

export const LlmQuestionPaperExtractionSchema = z.object({
  metadata: z.object({
    title: z.string().optional(),
    courseCode: z.string().optional(),
    examCode: z.string().optional(),
    institution: z.string().optional(),
    session: z.string().optional(),
    durationMinutes: z.number().optional(),
    maxMarks: z.number().optional(),
  }),
  rawInstructions: z.string().optional(),
  sections: z.array(LlmExtractedSectionSchema),
  uncertainties: z.array(z.string()).optional(),
});

export type LlmQuestionPaperExtraction = z.infer<
  typeof LlmQuestionPaperExtractionSchema
>;

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


// ============================================================
// LLM extraction output — ANSWER SHEET
// ============================================================

export const LlmExtractedAttemptSchema = z.object({
  /** Literally what the student wrote: "3", "Q.4(b)", "5 contd" — not resolved yet. */
  claimedLabel: z.string(),
  text: z.string(),
  /** The marker token itself, e.g. "Q3", kept separate from the answer body. */
  markerText: z.string().optional(),
  /** Origin of the marker specifically — this is what crop-and-re-OCR verifies against. */
  markerProvenance: textOriginSchema,
  /** Origin of the answer body (may span multiple blocks/pages in practice —
   *  if your OCR block granularity requires it, make this an array instead). */
  bodyProvenance: textOriginSchema,
  isContinuation: z.boolean().optional(),
  continuesFromLabel: z.string().optional(),
  hasDiagram: z.boolean().optional(),
  uncertainties: z.array(z.string()).optional(),
});

export type LlmExtractedAttempt = z.infer<typeof LlmExtractedAttemptSchema>;

export const LlmAnswerSheetExtractionSchema = z.object({
  studentIdentifier: z
    .object({
      rollNumber: z.string().optional(),
      rawText: z.string().optional(), // verbatim OCR of whatever field held it, for manual correction
    })
    .optional(),
  attempts: z.array(LlmExtractedAttemptSchema),
  /** Rough work, crossed-out attempts, illegible writing — anything that isn't
   *  a labeled answer must land here. Never silently drop handwritten content. */
  unmatchedText: z
    .array(
      z.object({
        text: z.string(),
        TextOrigin: textOriginSchema,
        reason: z.string().optional(), // "rough work" | "illegible" | "crossed out" | ...
      }),
    )
    .optional(),
  uncertainties: z.array(z.string()).optional(),
});

export type LlmAnswerSheetExtraction = z.infer<
  typeof LlmAnswerSheetExtractionSchema
>;

// ============================================================
// Stored / enriched — ANSWER SHEET
// ============================================================

export type ResolutionMethod = "label" | "content-match" | "manual" | "unresolved";

export interface Attempt {
  attemptId: string;
  claimedLabel: string;
  /** Inferred question, e.g. "B.3". Null until resolved (or if unresolvable). */
  resolvedQuestionId: string | null;
  resolutionMethod: ResolutionMethod;
  resolutionConfidence: number; // 0–1
  markerProvenance: TextOrigin;
  bodyProvenance: TextOrigin;
  /** The highlighted band: from this marker to the start of the next. */
  region: Region;
  text: string;
  hasDiagram: boolean;
  figures: Figure[];
  /** Position as written on the sheet — independent of question order,
   *  since students frequently answer out of sequence. */
  orderOnSheet: number;
  isContinuation: boolean;
  continuesFrom: string | null; // attemptId
  confidence: Confidence;
}

export interface UnmatchedRegion {
  regionId: string;
  text: string;
  region: Region;
  TextOrigin: TextOrigin;
  reason?: string;
}

export interface AnswerSheet {
  answerSheetId: string;
  /** The QuestionPaper this sheet is graded against. */
  paperId: string;
  sourceFileHash: string;
  schemaVersion: string;
  extractionVersion: string;
  extractedAt: string;
  pageCount: number;
  pageDimensions: PageDimensions[];
  studentIdentifier: {
    rollNumber: string | null;
    rawText: string | null;
    confidence: number;
  };
  attempts: Attempt[];
  unmatchedRegions: UnmatchedRegion[];
  /** Derived by diffing resolved attempts against paper.sections[].questions —
   *  never extracted directly. */
  unattemptedQuestions: string[]; // questionIds
  uncertainties: string[];
}




// input types:
// ============================================================
// Input types (trimmed OCR block, what we keep from Mistral)
// ============================================================


/** Raw block straight from OCR, before we assign an id. */
export interface RawBlock {
  content: string;
  type: string;
  box: { topLeftX: number; topLeftY: number; bottomRightX: number; bottomRightY: number };
}

export interface RawPage {
  index: number;
  dimensions: { width: number; height: number; dpi?: number };
  blocks: RawBlock[];
}

// ============================================================
// What the LLM receives — id + type + content ONLY. No geometry.
// ============================================================

export interface InventoryBlock {
  id: string; // "p0-b5"
  type: string;
  content: string;
}

export interface InventoryPage {
  page: number; // human-facing 1-based
  blocks: InventoryBlock[];
}

/** id -> geometry, kept in your code. Enrichment uses this to derive regions later. */
export interface BlockGeometry {
  page: number;
  pageWidth: number;
  pageHeight: number;
  box: RawBlock["box"];
}



