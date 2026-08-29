import Link from 'next/link';
import type { EvaluationPayload } from '@vedaai/shared';

import { AppShell } from '@/components/layout/AppShell';
import { ApiError, apiUrl, getEvaluation } from '@/lib/api';

/**
 * A processed evaluation.
 *
 * This is where the split screen — questions on the left, the answer document
 * on the right — will live. It is a placeholder today: the Figma frames for it
 * exist (`split-view-documents.png`, `questions-view-mobile.png`,
 * `answer-sheet-view-mobile.png`) but the screen is not built yet, so this
 * renders a plain summary of the payload to prove the wiring end to end.
 *
 * Fetching here rather than handing the payload to the router is what makes the
 * URL real: nothing is re-run, `GET /api/evaluations/:id` only reads the
 * in-memory store.
 */
export default async function EvaluationPage({
  params,
}: {
  params: Promise<{ evaluationId: string }>;
}) {
  const { evaluationId } = await params;

  let evaluation: EvaluationPayload;
  try {
    evaluation = await getEvaluation(evaluationId);
  } catch (err) {
    return (
      <AppShell section="Exams" userName="Madhur Rastogi" activeHref="/">
        <Unavailable message={err instanceof ApiError ? err.message : 'Something went wrong.'} />
      </AppShell>
    );
  }

  return (
    <AppShell section="Exams" userName="Madhur Rastogi" activeHref="/">
      <EvaluationSummary evaluation={evaluation} />
    </AppShell>
  );
}

/**
 * The realistic failure, not an edge case: the store holds ten evaluations and
 * dies with the process, so any link outlives what it points at.
 */
function Unavailable({ message }: { message: string }) {
  return (
    <div className="bg-surface rounded-panel min-h-125 flex h-full flex-col items-center justify-center px-6 text-center">
      <h1 className="text-ink text-2xl font-bold tracking-[-0.04em]">
        This evaluation isn&rsquo;t available
      </h1>
      <p className="text-ink-muted text-lead max-w-112 mt-2">{message}</p>
      <Link
        href="/"
        className="bg-surface-dark text-ink-inverse mt-7 flex h-[3.4rem] items-center rounded-full px-8 text-[1.05rem] font-semibold hover:brightness-125"
      >
        Upload again
      </Link>
    </div>
  );
}

/** Deliberately plain — every part of this is replaced by the split screen. */
function EvaluationSummary({ evaluation }: { evaluation: EvaluationPayload }) {
  const { paper, answerSheet, summary, documents } = evaluation;
  const questions = paper.sections.flatMap((s) => s.questions);
  const answered = questions.filter((q) => q.answered).length;

  return (
    <div className="bg-surface rounded-panel h-full overflow-y-auto p-6 lg:p-8">
      <h1 className="text-ink text-2xl font-bold tracking-[-0.04em]">Extraction complete</h1>
      <p className="text-ink-muted text-lead mt-2">
        A stand-in for the split screen, showing what the pipeline returned.
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Questions" value={`${answered} / ${questions.length} answered`} />
        <Stat label="Attempts on sheet" value={String(answerSheet.attempts.length)} />
        <Stat
          label="Resolved"
          value={`${summary.resolution.resolved} / ${summary.resolution.resolved + summary.resolution.unresolved}`}
        />
        <Stat
          label="Max marks"
          value={paper.maxMarks === undefined ? '—' : String(paper.maxMarks)}
        />
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        {documents.map((doc) => (
          <a
            key={doc.kind}
            href={apiUrl(doc.url)}
            target="_blank"
            rel="noreferrer"
            className="bg-surface-chip text-ink rounded-tile px-4 py-3 text-[0.9rem] hover:brightness-95"
          >
            {doc.fileName}
            <span className="text-ink-faint ml-2">
              {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}
            </span>
          </a>
        ))}
      </div>

      {paper.sections.map((section) => (
        <section key={section.sectionId} className="mt-8">
          <h2 className="text-ink text-card-title">
            {section.displayName}
            <span className="text-ink-faint ml-2 font-normal">
              attempt {section.attemptCount} of {section.totalQuestions}
            </span>
          </h2>

          <ul className="mt-3 flex flex-col gap-2">
            {section.questions.map((question) => (
              <li
                key={question.questionId}
                className="border-border-subtle flex gap-3 border-b pb-2 text-[0.9rem]"
              >
                <span className={question.answered ? 'text-brand' : 'text-ink-faint'}>
                  {question.displayLabel}
                </span>
                <span className="text-ink-muted min-w-0 flex-1 truncate">{question.text}</span>
                {question.marks !== undefined && (
                  <span className="text-ink-faint">{question.marks}m</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-panel rounded-tile px-4 py-3">
      <dt className="text-ink-muted text-[0.8rem]">{label}</dt>
      <dd className="text-ink mt-1 text-[1.05rem] font-semibold">{value}</dd>
    </div>
  );
}
