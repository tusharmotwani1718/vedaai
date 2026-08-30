import type { QuestionReview } from '@vedaai/shared';

/**
 * The `awarded / max` pill on a question card.
 *
 * Two visual states, not three. Either the marking model scored this answer, in
 * which case the number is shown - red for a zero, green otherwise, matching
 * the reference - or it did not, in which case a dash stands in.
 *
 * The dash covers every unscored case: nothing on the sheet answered the
 * question, or the model was not asked, or it failed. None of those mean the
 * student scored nothing, so none of them print a 0.
 *
 * A question the paper gives no marks for shows nothing at all; there is no
 * denominator to put it out of.
 */
export function MarksPill({ review, maxMarks }: { review: QuestionReview; maxMarks?: number }) {
  if (maxMarks === undefined) return null;

  const scored = review.status === 'reviewed' && review.awardedMarks !== null;

  const tone = !scored
    ? 'bg-surface-chip text-ink-faint'
    : review.awardedMarks === 0
      ? 'bg-mark-fail-bg text-mark-fail'
      : 'bg-mark-pass-bg text-mark-pass';

  return (
    <span
      className={`flex h-[1.6rem] shrink-0 items-center rounded-full px-2.5 text-[0.85rem] font-semibold tabular-nums ${tone}`}
      title={scored ? undefined : reasonFor(review.status)}
    >
      {/* An HTML entity, not a literal en dash: this one character is the
          difference between "not marked" and a score, and a literal is quietly
          flattened to a hyphen by anything that mishandles the encoding. */}
      {scored ? review.awardedMarks : <>&ndash;</>} / {maxMarks}
    </span>
  );
}

/** Why a dash is showing, for the pill's tooltip. */
function reasonFor(status: QuestionReview['status']): string {
  return status === 'unattempted'
    ? 'No answer for this question was found on the sheet'
    : 'Not marked';
}
