'use client';

import { useState } from 'react';

import { StartMappingButton } from './StartMappingButton';
import { UploadHero } from './UploadHero';
import { UploadPanel } from './UploadPanel';

/**
 * The upload screen.
 *
 * It owns which files have been chosen, because that is the only thing
 * separating the empty and uploaded references — the heading, illustration and
 * footnote are identical in both. The dropzones swap their own contents and the
 * button enables itself off the same state.
 */
export function UploadScreen() {
  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [answerSheet, setAnswerSheet] = useState<File | null>(null);

  const ready = questionPaper !== null && answerSheet !== null;

  return (
    <div className="max-w-248 mx-auto flex w-full flex-col px-1 py-0 lg:justify-center lg:py-6">
      <UploadHero />

      <div className="mt-7 lg:mt-9">
        <UploadPanel
          questionPaper={{
            file: questionPaper,
            onSelect: setQuestionPaper,
            onRemove: () => setQuestionPaper(null),
          }}
          answerSheet={{
            file: answerSheet,
            onSelect: setAnswerSheet,
            onRemove: () => setAnswerSheet(null),
          }}
        />
      </div>

      <div className="mt-8 flex flex-col items-center lg:mt-9">
        <StartMappingButton disabled={!ready} />
        <p className="text-ink-muted max-w-88 mt-4 text-center text-[0.85rem] leading-relaxed lg:max-w-none lg:text-[0.9rem]">
          Once both files are uploaded, you&rsquo;ll able to map answers with questions
        </p>
      </div>
    </div>
  );
}
