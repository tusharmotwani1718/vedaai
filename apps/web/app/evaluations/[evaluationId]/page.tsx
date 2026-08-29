import Link from 'next/link';
import type { EvaluationPayload } from '@vedaai/shared';

import { AppShell } from '@/components/layout/AppShell';
import { EvaluationScreen } from '@/components/evaluation/EvaluationScreen';
import { ApiError, getEvaluation } from '@/lib/api';

/**
 * A processed evaluation: the split screen.
 *
 * Fetching here rather than handing the payload to the router is what makes the
 * URL real — nothing is re-run, `GET /api/evaluations/:id` only reads the
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
      <EvaluationScreen evaluation={evaluation} />
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
