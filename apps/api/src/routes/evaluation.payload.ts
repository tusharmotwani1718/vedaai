import type {
  AttemptPayload,
  DocumentKind,
  DocumentPayload,
  EvaluationPayload,
  LlmExtractedAttempt,
  SectionPayload,
} from '@vedaai/shared';

import type { Evaluation } from '../store/evaluation.store';

/**
 * Turns a stored Evaluation into something that survives `JSON.stringify`.
 *
 * The shapes it produces are the wire contract and live in
 * `@vedaai/shared/types/evaluation.types` so the frontend compiles against the
 * same definitions; this file is only the conversion. Two things in the
 * pipeline do not serialize on their own:
 *
 *  - `mapping.byQuestionId` and the block `geometry` are `Map`s, which
 *    stringify to `{}`. The mapping becomes a plain object here; geometry is
 *    dropped entirely, because it is internal pixel-space machinery and the
 *    client only ever needs the normalized rects already baked into regions.
 *  - the raw document bytes, which are served from their own endpoint rather
 *    than inlined as base64.
 */

// Re-exported so existing importers (and the route) keep their single import site.
export type {
  AttemptPayload,
  DocumentPayload,
  EvaluationPayload,
  QuestionPayload,
  SectionPayload,
} from '@vedaai/shared';

function documentPayload(
  evaluationId: string,
  kind: DocumentKind,
  doc: {
    fileName: string;
    mimeType: string;
    pages: Array<{ index: number; width: number; height: number }>;
  },
): DocumentPayload {
  return {
    kind,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    pageCount: doc.pages.length,
    pages: doc.pages,
    url: `/api/evaluations/${evaluationId}/documents/${kind}`,
  };
}

export function toEvaluationPayload(evaluation: Evaluation): EvaluationPayload {
  const { questionPaper, answerSheet, mapping } = evaluation;
  const paper = questionPaper.result.extraction;

  // Map -> plain object, so the mapping survives JSON.
  const mappingObject = Object.fromEntries(mapping.byQuestionId);

  const sections: SectionPayload[] = paper.sections.map((s) => ({
    sectionId: s.sectionId,
    displayName: s.displayName,
    description: s.description,
    totalQuestions: s.totalQuestions,
    attemptCount: s.attemptCount,
    marksPerQuestion: s.marksPerQuestion,
    sectionTotal: s.sectionTotal,
    rawMarksExpression: s.rawMarksExpression,
    constraints: s.constraints,
    questions: s.questions.map((q) => {
      const questionId = `${s.sectionId}.${q.displayLabel}`;
      return {
        questionId,
        displayLabel: q.displayLabel,
        text: q.text,
        marks: q.marks,
        parts: (q.parts ?? []).map((p) => ({
          partId: `${questionId}.${p.label.replace(/[()]/g, '')}`,
          label: p.label,
          text: p.text,
          marks: p.marks,
        })),
        isOptionalWith: q.isOptionalWith ?? [],
        answered: questionId in mappingObject,
      };
    }),
  }));

  // Attempts come back in sheet order, carrying the ids everything else keys on.
  const regionByAttempt = new Map(answerSheet.result.regions.map((r) => [r.attemptId, r]));
  const resolutionByAttempt = new Map(mapping.resolution.resolutions.map((r) => [r.attemptId, r]));

  const attempts: AttemptPayload[] = answerSheet.result.validation.sheetOrder.flatMap((pos) => {
    const attempt: LlmExtractedAttempt | undefined =
      answerSheet.result.extraction.attempts[pos.index];
    if (attempt === undefined) return [];

    const resolved = resolutionByAttempt.get(pos.attemptId);

    return [
      {
        attemptId: pos.attemptId,
        orderOnSheet: pos.orderOnSheet,
        claimedLabel: attempt.claimedLabel,
        text: attempt.text,
        hasDiagram: attempt.hasDiagram === true,
        isContinuation: resolved?.isContinuation ?? false,
        continuesFrom: resolved?.continuesFrom ?? null,
        resolvedQuestionId: resolved?.resolvedQuestionId ?? null,
        resolutionConfidence: resolved?.resolutionConfidence ?? 0,
        region: regionByAttempt.get(pos.attemptId)?.region ?? { rects: [] },
      },
    ];
  });

  return {
    evaluationId: evaluation.id,
    createdAt: evaluation.createdAt,
    paper: {
      metadata: paper.metadata as unknown as Record<string, unknown>,
      rawInstructions: paper.rawInstructions,
      sections,
      maxMarks: paper.metadata.maxMarks,
    },
    answerSheet: {
      attempts,
      unattemptedQuestions: mapping.resolution.unattemptedQuestions,
    },
    mapping: mappingObject,
    issues: {
      // The question-paper validator predates the shared issue shape; its
      // structure checks are the part a teacher can act on.
      questionPaper: questionPaper.result.validation.structure.filter((s) => !s.ok),
      answerSheet: answerSheet.result.validation.issues,
      resolution: mapping.resolution.issues,
    },
    summary: {
      questionPaper: questionPaper.result.validation.summary,
      answerSheet: answerSheet.result.validation.summary,
      resolution: mapping.resolution.summary,
    },
    documents: [
      documentPayload(evaluation.id, 'question-paper', questionPaper.document),
      documentPayload(evaluation.id, 'answer-sheet', answerSheet.document),
    ],
  };
}
