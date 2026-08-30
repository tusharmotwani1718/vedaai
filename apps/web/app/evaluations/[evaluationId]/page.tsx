import type { EvaluationPayload } from '@vedaai/shared';

import { AppShell } from '@/components/layout/AppShell';
import { EvaluationScreen } from '@/components/evaluation/EvaluationScreen';
import { MessageScreen } from '@/components/ui/MessageScreen';
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
    <MessageScreen
      title="This evaluation is no longer available"
      actionHref="/"
      actionLabel="Upload again"
    >
      {message}
    </MessageScreen>
  );
}
