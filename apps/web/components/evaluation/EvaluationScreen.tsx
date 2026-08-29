'use client';

import { useMemo, useState } from 'react';
import type { EvaluationPayload, PageRect } from '@vedaai/shared';

import { apiUrl } from '@/lib/api';

import { AnswerSheetPane } from './AnswerSheetPane';
import { QuestionsPane } from './QuestionsPane';

type MobileTab = 'questions' | 'answer-sheet';

/**
 * The split screen: extracted questions on the left, the answer sheet on the
 * right, with the selected question's answer boxed on the sheet.
 *
 * Both panes exist at every breakpoint and only their visibility changes — from
 * `lg` up they sit side by side, below it the tabs show one at a time. Keeping
 * both mounted is deliberate: switching tabs must not throw away the rendered
 * PDF page and re-render it from scratch.
 */
export function EvaluationScreen({ evaluation }: { evaluation: EvaluationPayload }) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [tab, setTab] = useState<MobileTab>('questions');

  const sheet = evaluation.documents.find((doc) => doc.kind === 'answer-sheet');
  const questions = useMemo(
    () => evaluation.paper.sections.flatMap((section) => section.questions),
    [evaluation],
  );

  const selected = questions.find((q) => q.questionId === selectedQuestionId) ?? null;
  const answer = selectedQuestionId === null ? undefined : evaluation.mapping[selectedQuestionId];
  const rects: PageRect[] = answer?.region.rects ?? [];

  /**
   * Selecting a question jumps the sheet to where that answer starts, which is
   * the whole interaction — otherwise the highlight is drawn on a page the
   * teacher is not looking at. Expanding it too matches the reference, where the
   * selected card is the one showing its feedback.
   */
  function select(questionId: string) {
    setSelectedQuestionId(questionId);
    setExpanded(new Set([...expanded, questionId]));

    const first = evaluation.mapping[questionId]?.region.rects[0];
    if (first !== undefined) setPageIndex(first.page);
  }

  function toggle(questionId: string) {
    const next = new Set(expanded);
    if (!next.delete(questionId)) next.add(questionId);
    setExpanded(next);
  }

  const allExpanded = questions.length > 0 && expanded.size >= questions.length;

  function toggleAll() {
    setExpanded(allExpanded ? new Set() : new Set(questions.map((q) => q.questionId)));
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 lg:gap-4">
      <MobileTabs active={tab} onChange={setTab} />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <div className={paneVisibility(tab === 'questions')}>
          <QuestionsPane
            sections={evaluation.paper.sections}
            selectedQuestionId={selectedQuestionId}
            expanded={expanded}
            allExpanded={allExpanded}
            onSelect={select}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />
        </div>

        <div className={paneVisibility(tab === 'answer-sheet')}>
          {sheet === undefined ? (
            <div className="bg-surface rounded-panel text-ink-muted grid h-full place-items-center">
              This evaluation has no answer sheet.
            </div>
          ) : (
            <AnswerSheetPane
              document={{ ...sheet, url: apiUrl(sheet.url) }}
              pageIndex={Math.min(pageIndex, sheet.pageCount - 1)}
              pageCount={sheet.pageCount}
              zoom={zoom}
              rects={rects.filter((rect) => rect.page === pageIndex)}
              label={selected === null ? null : questionTag(selected.displayLabel)}
              onPageChange={setPageIndex}
              onZoomChange={setZoom}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** Hidden below `lg` unless its tab is active; always shown from `lg` up. */
function paneVisibility(active: boolean): string {
  return `min-h-0 ${active ? 'flex flex-col' : 'hidden'} lg:flex lg:flex-col`;
}

/** "2" -> "Q2", but "Q3(a)" is left alone. */
function questionTag(displayLabel: string): string {
  return /^q/i.test(displayLabel) ? displayLabel : `Q${displayLabel}`;
}

function MobileTabs({
  active,
  onChange,
}: {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
}) {
  const tabs: Array<{ id: MobileTab; label: string }> = [
    { id: 'questions', label: 'Questions' },
    { id: 'answer-sheet', label: 'Answer Sheet' },
  ];

  return (
    <div className="bg-surface rounded-panel flex shrink-0 gap-1 p-1.5 lg:hidden" role="tablist">
      {tabs.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={active === item.id}
          onClick={() => onChange(item.id)}
          className={[
            'flex-1 cursor-pointer rounded-full py-3 text-[0.95rem] font-semibold transition-colors',
            active === item.id ? 'bg-surface-dark text-ink-inverse' : 'text-ink-muted',
          ].join(' ')}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
