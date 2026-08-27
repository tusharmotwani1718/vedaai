// Resolution — the join between what a student wrote and what the paper asked.
//
// This is the last link in the chain. The validator says an attempt's text is
// real and where it sits; region derivation turns that into rectangles. Neither
// knows WHICH QUESTION an answer belongs to. Without this file, clicking "Q3"
// in the questions pane has nothing to highlight.
//
// It is deliberately separate from validate.answer-extraction.ts, which is
// about OCR consistency alone and needs no question paper. Resolution is the
// only step that reads both documents.
//
// The LLM is never asked to do this mapping — it does not see the paper, and
// asking it to guess question ids is exactly how hallucinated mappings get in.
// Matching is done here, in code, from the label the student actually wrote.

import type {
  LlmAnswerSheetExtraction,
  LlmExtractedAttempt,
  LlmQuestionPaperExtraction,
  Region,
  ResolutionMethod,
} from '@vedaai/shared';

import type { AttemptRegion } from '../regions/derive-regions';
import type {
  AnswerValidationIssue,
  SheetPosition,
} from '../validators/validate.answer-extraction';

/** A label unique in the paper. */
const UNIQUE_LABEL_CONFIDENCE = 0.95;
/** An ambiguous label decided by which section the student was working in. */
const SECTION_CONTEXT_CONFIDENCE = 0.7;
/** Ceiling for a continuation, which is only ever as good as its parent. */
const INHERITED_CONFIDENCE = 0.9;

// ============================================================
// Label normalization
// ============================================================

/**
 * Strips the decoration students put around answer numbers so a written label
 * can be compared with a printed one.
 *
 *   "Q.4(b)"  -> "4(b)"
 *   "Q1"      -> "1"
 *   "Ans 3"   -> "3"
 *   "5 contd" -> "5"
 *
 * The prefixes match with a digit lookahead rather than a trailing word
 * boundary: in "Q1" both characters are word characters, so there is no
 * boundary between them, and a \b-anchored pattern silently leaves the "q" in
 * place. The alternatives are ordered longest-first because regex alternation
 * is leftmost-first, so "question" has to be offered before "q".
 */
export function normalizeLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\b(?:answer|ans)\s*[.:)-]?\s*(?=\d)/g, '')
    .replace(/\b(?:question|ques|que|q)\s*[.:)-]?\s*(?=\d)/g, '')
    .replace(/\b(?:continued|contd|cont)\b\.?/g, '')
    .replace(/[^a-z0-9()]/g, '');
}

// ============================================================
// Indexing the paper by label
// ============================================================

/** One question (or part) a written label could refer to. */
export interface LabelCandidate {
  id: string;
  sectionId: string;
}

export interface PaperLabelIndex {
  /** Normalized label -> candidate question/part ids. */
  byLabel: Map<string, LabelCandidate[]>;
  /** Every questionId in the paper, in paper order. */
  allQuestionIds: string[];
  /** questionId (or partId) -> sectionId. */
  sectionOf: Map<string, string>;
  /**
   * questionId (or partId) -> the questionId it belongs to. Answering "3(a)"
   * means Q3 was attempted, so counts and coverage work on the parent.
   * Question ids map to themselves.
   */
  parentQuestionOf: Map<string, string>;
}

/**
 * Indexes the paper by every label a student might plausibly write: the
 * question label ("4") and, when the question has printed sub-parts, the
 * combined label ("4(b)").
 */
export function buildPaperLabelIndex(paper: LlmQuestionPaperExtraction): PaperLabelIndex {
  const byLabel = new Map<string, LabelCandidate[]>();
  const allQuestionIds: string[] = [];
  const sectionOf = new Map<string, string>();
  const parentQuestionOf = new Map<string, string>();

  const add = (label: string, id: string, sectionId: string): void => {
    const key = normalizeLabel(label);
    if (key.length === 0) return;
    const bucket = byLabel.get(key);
    if (bucket) bucket.push({ id, sectionId });
    else byLabel.set(key, [{ id, sectionId }]);
  };

  for (const section of paper.sections) {
    for (const q of section.questions) {
      const questionId = `${section.sectionId}.${q.displayLabel}`;
      allQuestionIds.push(questionId);
      sectionOf.set(questionId, section.sectionId);
      parentQuestionOf.set(questionId, questionId);
      add(q.displayLabel, questionId, section.sectionId);

      for (const part of q.parts ?? []) {
        const bare = part.label.replace(/[()]/g, '');
        const partId = `${questionId}.${bare}`;
        sectionOf.set(partId, section.sectionId);
        parentQuestionOf.set(partId, questionId);
        add(`${q.displayLabel}(${bare})`, partId, section.sectionId);
      }
    }
  }

  return { byLabel, allQuestionIds, sectionOf, parentQuestionOf };
}

// ============================================================
// Continuation chains
// ============================================================
//
// "5 contd" on a later page stays its own attempt, linked back to the original,
// so each marker keeps the region it produced. Both regions end up under the
// same question once resolution inherits the parent's id.

export interface ContinuationLink {
  attemptId: string;
  claimedLabel: string;
  isContinuation: boolean;
  /** attemptId of the attempt this continues, or null. */
  continuesFrom: string | null;
  ok: boolean;
  reason?: string;
}

export function linkContinuations(
  attempts: LlmExtractedAttempt[],
  order: SheetPosition[],
): ContinuationLink[] {
  // Walk in sheet order so "continues from" can only ever point backwards,
  // which makes a cycle impossible by construction.
  const byLabel = new Map<string, string>(); // normalized label -> attemptId seen so far
  const links: ContinuationLink[] = [];

  for (const pos of order) {
    const attempt = attempts[pos.index];
    if (attempt === undefined) continue;

    const label = normalizeLabel(attempt.claimedLabel);
    const isContinuation = attempt.isContinuation === true || attempt.continuesFromLabel != null;

    if (!isContinuation) {
      links.push({
        attemptId: pos.attemptId,
        claimedLabel: attempt.claimedLabel,
        isContinuation: false,
        continuesFrom: null,
        ok: true,
      });
      // First writer wins; a later duplicate is reported by findDuplicates.
      if (!byLabel.has(label)) byLabel.set(label, pos.attemptId);
      continue;
    }

    // Prefer the label the model named, fall back to the attempt's own label
    // ("5 contd" normalizes to "5", which is exactly what we want).
    const targetLabel = normalizeLabel(attempt.continuesFromLabel ?? attempt.claimedLabel);
    const parent = byLabel.get(targetLabel) ?? null;

    links.push({
      attemptId: pos.attemptId,
      claimedLabel: attempt.claimedLabel,
      isContinuation: true,
      continuesFrom: parent,
      ok: parent !== null,
      reason:
        parent !== null
          ? undefined
          : `continuation of "${targetLabel}" has no earlier attempt to attach to`,
    });
  }

  return links;
}

// ============================================================
// Resolution
// ============================================================

export interface AttemptResolution {
  attemptId: string;
  orderOnSheet: number;
  claimedLabel: string;
  normalizedLabel: string;
  resolvedQuestionId: string | null;
  resolutionMethod: ResolutionMethod;
  /** 0–1. See the confidence constants at the top of this file. */
  resolutionConfidence: number;
  isContinuation: boolean;
  continuesFrom: string | null;
  reason?: string;
}

/**
 * Resolves each attempt's claimed label to a questionId.
 *
 * A label unique in the paper resolves outright. An ambiguous one — papers that
 * restart numbering per section put a "4" in both PART-A and PART-B — is
 * decided by section context: the section of the most recently resolved
 * attempt, since students work through the paper section by section, and the
 * blocks are walked in sheet order so "most recent" means "just above this one
 * on the page". With no usable context the attempt is left unresolved rather
 * than guessed at, because a wrong mapping puts a student's answer under
 * someone else's question.
 */
export function resolveAttempts(
  attempts: LlmExtractedAttempt[],
  order: SheetPosition[],
  links: Map<string, ContinuationLink>,
  index: PaperLabelIndex,
): AttemptResolution[] {
  const resolutions: AttemptResolution[] = [];
  const resolvedByAttemptId = new Map<string, { questionId: string; confidence: number }>();
  let currentSectionId: string | null = null;

  for (const pos of order) {
    const attempt = attempts[pos.index];
    if (attempt === undefined) continue;

    const link = links.get(pos.attemptId);
    const normalized = normalizeLabel(attempt.claimedLabel);

    const base = {
      attemptId: pos.attemptId,
      orderOnSheet: pos.orderOnSheet,
      claimedLabel: attempt.claimedLabel,
      normalizedLabel: normalized,
      isContinuation: link?.isContinuation ?? false,
      continuesFrom: link?.continuesFrom ?? null,
    };

    // A continuation inherits its parent's resolution — the label on a "contd"
    // marker is the same one, and re-resolving it would only add a second
    // chance to get it wrong.
    if (base.isContinuation && base.continuesFrom !== null) {
      const parent = resolvedByAttemptId.get(base.continuesFrom);
      const inherited = parent?.questionId ?? null;
      const confidence =
        parent === undefined ? 0 : Math.min(parent.confidence, INHERITED_CONFIDENCE);

      resolutions.push({
        ...base,
        resolvedQuestionId: inherited,
        resolutionMethod: inherited === null ? 'unresolved' : 'label',
        resolutionConfidence: confidence,
        reason:
          inherited === null ? 'parent attempt is itself unresolved' : 'inherited from parent',
      });
      if (inherited !== null) {
        resolvedByAttemptId.set(pos.attemptId, { questionId: inherited, confidence });
      }
      continue;
    }

    const candidates = index.byLabel.get(normalized) ?? [];

    if (candidates.length === 1) {
      const only = candidates[0]!;
      resolutions.push({
        ...base,
        resolvedQuestionId: only.id,
        resolutionMethod: 'label',
        resolutionConfidence: UNIQUE_LABEL_CONFIDENCE,
      });
      resolvedByAttemptId.set(pos.attemptId, {
        questionId: only.id,
        confidence: UNIQUE_LABEL_CONFIDENCE,
      });
      currentSectionId = only.sectionId;
      continue;
    }

    if (candidates.length > 1) {
      // Annotated explicitly: without it the inferred type of `inSection`
      // flows back into `currentSectionId`, which it is derived from.
      const inSection: LabelCandidate[] =
        currentSectionId === null ? [] : candidates.filter((c) => c.sectionId === currentSectionId);

      if (inSection.length === 1) {
        const picked: LabelCandidate = inSection[0]!;
        resolutions.push({
          ...base,
          resolvedQuestionId: picked.id,
          resolutionMethod: 'label',
          resolutionConfidence: SECTION_CONTEXT_CONFIDENCE,
          reason: `ambiguous label; resolved to section ${picked.sectionId} from sheet context`,
        });
        resolvedByAttemptId.set(pos.attemptId, {
          questionId: picked.id,
          confidence: SECTION_CONTEXT_CONFIDENCE,
        });
        currentSectionId = picked.sectionId;
        continue;
      }

      resolutions.push({
        ...base,
        resolvedQuestionId: null,
        resolutionMethod: 'unresolved',
        resolutionConfidence: 0,
        reason: `label matches ${candidates.map((c) => c.id).join(', ')} and section context does not disambiguate`,
      });
      continue;
    }

    resolutions.push({
      ...base,
      resolvedQuestionId: null,
      resolutionMethod: 'unresolved',
      resolutionConfidence: 0,
      reason: `no question in the paper has label "${normalized}"`,
    });
  }

  return resolutions;
}

// ============================================================
// Cross-checks against the paper
// ============================================================

export interface DuplicateAttempt {
  questionId: string;
  attemptIds: string[];
}

function findDuplicates(resolutions: AttemptResolution[]): DuplicateAttempt[] {
  const byQuestion = new Map<string, string[]>();

  for (const r of resolutions) {
    if (r.resolvedQuestionId === null || r.isContinuation) continue;
    const bucket = byQuestion.get(r.resolvedQuestionId) ?? [];
    bucket.push(r.attemptId);
    byQuestion.set(r.resolvedQuestionId, bucket);
  }

  return [...byQuestion.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([questionId, attemptIds]) => ({ questionId, attemptIds }));
}

export interface AttemptCountCheck {
  sectionId: string;
  /** How many the section allows. */
  attemptCount: number;
  resolvedAttempts: number;
  ok: boolean;
  reason?: string;
}

/**
 * Flags sections where the student answered more questions than the paper
 * allows ("Attempt any 5" with 6 answered). Reported, not resolved — which of
 * the extras counts is a marking-policy decision, not a validation one.
 */
function checkAttemptCounts(
  paper: LlmQuestionPaperExtraction,
  resolutions: AttemptResolution[],
  index: PaperLabelIndex,
): AttemptCountCheck[] {
  const perSection = new Map<string, Set<string>>();

  for (const r of resolutions) {
    // Continuations are part of an answer already counted, not a new one.
    if (r.resolvedQuestionId === null || r.isContinuation) continue;
    const sectionId = index.sectionOf.get(r.resolvedQuestionId);
    if (sectionId === undefined) continue;

    const bucket = perSection.get(sectionId) ?? new Set<string>();
    // Two parts of the same question are one answered question, not two.
    bucket.add(index.parentQuestionOf.get(r.resolvedQuestionId) ?? r.resolvedQuestionId);
    perSection.set(sectionId, bucket);
  }

  return paper.sections.map((s) => {
    const resolvedAttempts = perSection.get(s.sectionId)?.size ?? 0;
    const allowed = s.attemptCount > 0 ? s.attemptCount : s.totalQuestions;
    const ok = resolvedAttempts <= allowed;
    return {
      sectionId: s.sectionId,
      attemptCount: allowed,
      resolvedAttempts,
      ok,
      reason: ok ? undefined : `answered ${resolvedAttempts}, section allows ${allowed}`,
    };
  });
}

// ============================================================
// Orchestrator
// ============================================================

export interface AnswerResolutionReport {
  resolutions: AttemptResolution[];
  continuations: ContinuationLink[];
  duplicates: DuplicateAttempt[];
  attemptCounts: AttemptCountCheck[];
  /** questionIds in the paper that no attempt resolved to. */
  unattemptedQuestions: string[];
  /** Same UI-ready shape the validator emits, so the UI has one vocabulary. */
  issues: AnswerValidationIssue[];
  summary: { resolved: number; unresolved: number };
}

/**
 * Maps every attempt on the sheet onto a question in the paper.
 *
 * `sheetOrder` comes from the validation report — resolution depends on reading
 * order both for continuation chains and for the section-context tiebreak, and
 * the validator is what establishes it.
 */
export function resolveAnswerSheet(
  extracted: LlmAnswerSheetExtraction,
  sheetOrder: SheetPosition[],
  paper: LlmQuestionPaperExtraction,
): AnswerResolutionReport {
  const index = buildPaperLabelIndex(paper);
  const continuations = linkContinuations(extracted.attempts, sheetOrder);
  const linkById = new Map(continuations.map((l) => [l.attemptId, l]));
  const resolutions = resolveAttempts(extracted.attempts, sheetOrder, linkById, index);

  const duplicates = findDuplicates(resolutions);
  const attemptCounts = checkAttemptCounts(paper, resolutions, index);

  // A resolved part marks its parent question answered.
  const answered = new Set(
    resolutions
      .map((r) => r.resolvedQuestionId)
      .filter((id): id is string => id !== null)
      .map((id) => index.parentQuestionOf.get(id) ?? id),
  );
  const unattemptedQuestions = index.allQuestionIds.filter((id) => !answered.has(id));

  const issues: AnswerValidationIssue[] = [];

  for (const r of continuations.filter((c) => !c.ok)) {
    issues.push({
      severity: 'error',
      code: 'ORPHAN_CONTINUATION',
      scope: r.attemptId,
      message: r.reason ?? 'continuation has no parent',
    });
  }

  for (const r of resolutions.filter((x) => x.resolvedQuestionId === null)) {
    issues.push({
      severity: 'error',
      code: 'UNRESOLVED_ATTEMPT',
      scope: r.attemptId,
      message: `"${r.claimedLabel}" could not be mapped to a question — ${r.reason ?? 'no match'}`,
    });
  }

  for (const r of resolutions.filter(
    (x) => x.resolutionConfidence > 0 && x.resolutionConfidence < INHERITED_CONFIDENCE,
  )) {
    issues.push({
      severity: 'warning',
      code: 'LOW_CONFIDENCE_MAPPING',
      scope: r.attemptId,
      message: `"${r.claimedLabel}" mapped to ${r.resolvedQuestionId} — ${r.reason ?? 'low confidence'}`,
    });
  }

  for (const d of duplicates) {
    issues.push({
      severity: 'warning',
      code: 'DUPLICATE_ATTEMPT',
      scope: d.attemptIds.join(', '),
      message: `${d.attemptIds.length} separate attempts map to ${d.questionId}`,
    });
  }

  for (const c of attemptCounts.filter((x) => !x.ok)) {
    issues.push({
      severity: 'warning',
      code: 'OVER_ATTEMPTED',
      scope: `section ${c.sectionId}`,
      message: c.reason ?? 'more answers than the section allows',
    });
  }

  const resolved = resolutions.filter((r) => r.resolvedQuestionId !== null).length;

  return {
    resolutions,
    continuations,
    duplicates,
    attemptCounts,
    unattemptedQuestions,
    issues,
    summary: { resolved, unresolved: resolutions.length - resolved },
  };
}

// ============================================================
// The thing the UI actually asks for
// ============================================================

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

/**
 * Closes the loop: questionId -> the rectangles to highlight.
 *
 * This is what the answers pane consumes. Click a question in the list, look it
 * up here, draw `region.rects` over the page.
 *
 * Attempts resolving to a part ("3(a)") are filed under their parent question
 * as well, so clicking Q3 highlights every part the student answered.
 */
export function buildQuestionAnswerIndex(
  report: AnswerResolutionReport,
  regions: AttemptRegion[],
  index: PaperLabelIndex,
): Map<string, QuestionAnswer> {
  const regionByAttempt = new Map(regions.map((r) => [r.attemptId, r]));
  const out = new Map<string, QuestionAnswer>();

  // Sheet order, so a continuation's rects follow the original's.
  const ordered = [...report.resolutions].sort((a, b) => a.orderOnSheet - b.orderOnSheet);

  for (const r of ordered) {
    if (r.resolvedQuestionId === null) continue;

    // File under both the exact target and its parent question, unless they are
    // the same id — clicking Q3 should find an answer written as "3(a)".
    const parentId = index.parentQuestionOf.get(r.resolvedQuestionId) ?? r.resolvedQuestionId;
    const targets =
      parentId === r.resolvedQuestionId ? [r.resolvedQuestionId] : [r.resolvedQuestionId, parentId];

    for (const questionId of targets) {
      const existing = out.get(questionId);
      const rects = regionByAttempt.get(r.attemptId)?.region.rects ?? [];

      if (existing === undefined) {
        out.set(questionId, {
          questionId,
          attemptIds: [r.attemptId],
          region: { rects: [...rects] },
          confidence: r.resolutionConfidence,
          method: r.resolutionMethod,
        });
        continue;
      }

      existing.attemptIds.push(r.attemptId);
      existing.region.rects.push(...rects);
      existing.confidence = Math.min(existing.confidence, r.resolutionConfidence);
    }
  }

  return out;
}
