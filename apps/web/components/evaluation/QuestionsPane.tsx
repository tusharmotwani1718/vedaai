'use client';

import { useMemo } from 'react';
import type { SectionPayload } from '@vedaai/shared';

import { QuestionCard } from './QuestionCard';

/**
 * The left pane: every extracted question, in paper order.
 *
 * The reference shows a flat 1..n list with no section headings, which is what
 * a single-section paper looks like. Real papers are sectioned — the payload
 * carries "attempt any 5 of 7" per section — so a heading appears only when
 * there is more than one section to tell apart. The numbering stays continuous
 * across them, matching the reference.
 */
export function QuestionsPane({
  sections,
  selectedQuestionId,
  expanded,
  allExpanded,
  onSelect,
  onToggle,
  onToggleAll,
}: {
  sections: SectionPayload[];
  selectedQuestionId: string | null;
  expanded: ReadonlySet<string>;
  allExpanded: boolean;
  onSelect: (questionId: string) => void;
  onToggle: (questionId: string) => void;
  onToggleAll: () => void;
}) {
  const multiSection = sections.length > 1;

  // The badge number runs 1..n across the whole paper, so it cannot come from
  // the index within a section. Resolved up front rather than by counting as we
  // render, which would mutate during the render pass.
  const numbering = useMemo(() => {
    const byQuestionId = new Map<string, number>();
    for (const section of sections) {
      for (const question of section.questions) {
        byQuestionId.set(question.questionId, byQuestionId.size + 1);
      }
    }
    return byQuestionId;
  }, [sections]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 px-1 pb-4">
        <h2 className="text-ink text-[1.05rem] font-bold tracking-[-0.02em]">
          Extracted Questions <span className="font-normal">(from question paper)</span>
        </h2>

        <button
          type="button"
          onClick={onToggleAll}
          className="bg-surface text-ink ring-border-subtle shrink-0 cursor-pointer rounded-full px-4 py-2 text-[0.85rem] font-medium ring-1 hover:brightness-95"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1 pb-2">
        {sections.map((section) => (
          <section key={section.sectionId} className="flex flex-col gap-3">
            {multiSection && (
              <h3 className="text-ink-muted px-1 pt-1 text-[0.85rem] font-semibold">
                {section.displayName}
                {section.attemptCount < section.totalQuestions && (
                  <span className="font-normal">
                    {' '}
                    — attempt any {section.attemptCount} of {section.totalQuestions}
                  </span>
                )}
              </h3>
            )}

            {section.questions.map((question) => (
              <QuestionCard
                key={question.questionId}
                question={question}
                index={numbering.get(question.questionId) ?? 0}
                selected={question.questionId === selectedQuestionId}
                expanded={expanded.has(question.questionId)}
                onSelect={() => onSelect(question.questionId)}
                onToggle={() => onToggle(question.questionId)}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
