'use client';

import type { QuestionPayload } from '@vedaai/shared';

import { ChevronDownIcon } from '@/components/ui/icons';

import { MarksPill } from './MarksPill';

/**
 * One question in the left pane.
 *
 * The reference lays this out differently per breakpoint, so this is not just a
 * size change. On desktop everything is one row — badge, text, pill, chevron.
 * On mobile the badge, pill and chevron share a top row and the question text
 * runs full width beneath them, which is why the two orders are expressed with
 * `order-*` rather than by duplicating the markup.
 */
export function QuestionCard({
  question,
  index,
  selected,
  expanded,
  onSelect,
  onToggle,
}: {
  question: QuestionPayload;
  /** Position in the flat list, 1-based — the number in the badge. */
  index: number;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={[
        'bg-surface rounded-2xl p-3 transition-colors lg:p-3.5',
        selected ? 'ring-brand ring-2' : 'ring-border-subtle/70 ring-1',
      ].join(' ')}
    >
      {/* The row is a button so the whole card selects on click; the chevron
          below is a nested control, so it stops the click propagating. */}
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex w-full cursor-pointer flex-wrap items-center gap-x-3 gap-y-2.5 text-left lg:flex-nowrap"
      >
        <span
          className={[
            'grid size-6 shrink-0 place-items-center rounded-full text-[0.78rem] font-semibold',
            selected ? 'bg-brand text-ink-inverse' : 'bg-badge text-ink-inverse',
          ].join(' ')}
        >
          {index}
        </span>

        <span className="text-ink lg:order-0 order-last w-full text-[0.95rem] leading-snug lg:min-w-0 lg:flex-1">
          {question.text}
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          <MarksPill review={question.review} maxMarks={question.marks} />

          <span
            role="button"
            tabIndex={0}
            aria-label={expanded ? 'Hide AI feedback' : 'Show AI feedback'}
            aria-expanded={expanded}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              event.stopPropagation();
              onToggle();
            }}
            className="bg-surface-chip text-ink grid size-6 shrink-0 cursor-pointer place-items-center rounded-lg hover:brightness-95"
          >
            <ChevronDownIcon
              className={`size-[0.9rem] transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </span>
        </span>
      </button>

      {expanded && <AiFeedback question={question} />}
    </div>
  );
}

/**
 * The expanded panel.
 *
 * The marking call returns a score and nothing else by design, so there is no
 * written feedback to quote yet. Rather than show an empty box, each state says
 * what is actually known - and a scored question reports its score rather than
 * claiming nothing has looked at it.
 */
function AiFeedback({ question }: { question: QuestionPayload }) {
  const { review } = question;

  const body = review.feedback ?? placeholderFor(question);

  return (
    <div className="bg-surface-chip mt-3 rounded-xl p-3.5">
      <h3 className="text-ink text-[0.9rem] font-semibold">AI Feedback</h3>
      <p
        className={`mt-1.5 text-[0.875rem] leading-relaxed ${
          review.feedback === null ? 'text-ink-faint' : 'text-ink-muted'
        }`}
      >
        {body}
      </p>
    </div>
  );
}

/** What the panel says when there is no written feedback to show. */
function placeholderFor({ review, marks }: QuestionPayload): string {
  if (review.status === 'unattempted') {
    return 'No answer for this question was found on the sheet.';
  }

  if (review.status === 'reviewed' && review.awardedMarks !== null) {
    const outOf = marks === undefined ? '' : ` out of ${marks}`;
    return `AI marking scored this ${review.awardedMarks}${outOf}. Written feedback is not generated yet.`;
  }

  return 'Not marked - AI marking did not return a score for this question.';
}
