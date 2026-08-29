import type { QuestionReview } from '@vedaai/shared';

/**
 * The `awarded / max` pill on a question card.
 *
 * Three states, because the marking model does not exist yet:
 *
 *  - `unattempted` — nothing on the sheet answers this, so zero is a fact the
 *    resolver established. Red, exactly as the reference shows for Q4.
 *  - `reviewed` — a real score. Green.
 *  - `pending` — an answer exists but nothing has judged it. Rendered with a
 *    dash in place of the score rather than a number, since any number here
 *    would be one a teacher could act on.
 *
 * A question the paper gives no marks for shows nothing at all; there is no
 * denominator to put it out of.
 */
export function MarksPill({ review, maxMarks }: { review: QuestionReview; maxMarks?: number }) {
  if (maxMarks === undefined) return null;

  const pending = review.status === 'pending' || review.awardedMarks === null;
  const scored = pending ? '–' : String(review.awardedMarks);

  const tone = pending
    ? 'bg-surface-chip text-ink-faint'
    : review.awardedMarks === 0
      ? 'bg-mark-fail-bg text-mark-fail'
      : 'bg-mark-pass-bg text-mark-pass';

  return (
    <span
      className={`flex h-[1.6rem] shrink-0 items-center rounded-full px-2.5 text-[0.85rem] font-semibold tabular-nums ${tone}`}
      title={pending ? 'Not marked yet' : undefined}
    >
      {scored} / {maxMarks}
    </span>
  );
}
