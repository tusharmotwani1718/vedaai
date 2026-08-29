'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from '@vedaai/shared';

import { ApiError, createEvaluation } from '@/lib/api';
import { formatFileSize } from '@/lib/file-meta';

import { ExtractingState } from './ExtractingState';
import { StartMappingButton } from './StartMappingButton';
import { UploadHero } from './UploadHero';
import { UploadPanel } from './UploadPanel';

/**
 * The upload screen, and the extraction it kicks off.
 *
 * It owns which files have been chosen, because that is the only thing
 * separating the empty and uploaded references — the heading, illustration and
 * footnote are identical in both. The dropzones swap their own contents and the
 * button enables itself off the same state.
 *
 * Once "Start Mapping" is pressed the whole screen is replaced by
 * `ExtractingState` until the API answers. On success we route to the
 * evaluation's own page; on failure we come back here with both files still
 * chosen, so retrying is one click rather than two file pickers.
 */
export function UploadScreen() {
  const router = useRouter();

  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [answerSheet, setAnswerSheet] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = questionPaper !== null && answerSheet !== null;

  /**
   * The dropzone advertises a size limit, so it has to enforce one — otherwise
   * an oversized file is accepted here and only rejected a minute later, after
   * the upload has already been sent.
   */
  function choose(setFile: (file: File) => void) {
    return (file: File) => {
      if (file.size > MAX_UPLOAD_BYTES) {
        setError(
          `${file.name} is ${formatFileSize(file.size)} — files must be under ${MAX_UPLOAD_MB}MB.`,
        );
        return;
      }
      setError(null);
      setFile(file);
    };
  }

  async function startMapping() {
    if (questionPaper === null || answerSheet === null) return;

    setExtracting(true);
    setError(null);

    try {
      const evaluation = await createEvaluation({ questionPaper, answerSheet });

      // Deliberately stay in the extracting state through the navigation: the
      // next route fetches on the server, and dropping back to the form here
      // would flash the upload screen between the two.
      router.push(`/evaluations/${evaluation.evaluationId}`);
    } catch (err) {
      setExtracting(false);
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong while extracting. Please try again.',
      );
    }
  }

  if (extracting) return <ExtractingState />;

  return (
    <div className="max-w-248 mx-auto flex w-full flex-col px-1 py-0 lg:justify-center lg:py-6">
      <UploadHero />

      <div className="mt-7 lg:mt-9">
        <UploadPanel
          questionPaper={{
            file: questionPaper,
            onSelect: choose(setQuestionPaper),
            onRemove: () => setQuestionPaper(null),
          }}
          answerSheet={{
            file: answerSheet,
            onSelect: choose(setAnswerSheet),
            onRemove: () => setAnswerSheet(null),
          }}
        />
      </div>

      <div className="mt-8 flex flex-col items-center lg:mt-9">
        <StartMappingButton disabled={!ready} onClick={() => void startMapping()} />

        {/* The reference has one line of copy here. A failure replaces it rather
            than pushing the layout around, since it says the same kind of thing
            — what to do next. */}
        {error === null ? (
          <p className="text-ink-muted max-w-88 mt-4 text-center text-[0.85rem] leading-relaxed lg:max-w-none lg:text-[0.9rem]">
            Once both files are uploaded, you&rsquo;ll able to map answers with questions
          </p>
        ) : (
          <p
            role="alert"
            className="text-danger max-w-88 lg:max-w-md mt-4 text-center text-[0.85rem] leading-relaxed lg:text-[0.9rem]"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
