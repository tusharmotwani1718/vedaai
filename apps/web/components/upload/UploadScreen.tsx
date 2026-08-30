'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, type EvaluationPhase } from '@vedaai/shared';

import { ApiError, createEvaluation } from '@/lib/api';
import { formatFileSize } from '@/lib/file-meta';
import { newUploadId, watchEvaluationProgress } from '@/lib/progress-socket';

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
  const [phase, setPhase] = useState<EvaluationPhase | null>(null);
  const [complete, setComplete] = useState(false);
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
    setPhase(null);
    setComplete(false);

    // The id is minted here, before anything is sent, so the socket can be
    // listening for this upload by the time the server starts reporting on it.
    const uploadId = newUploadId();
    const progress = watchEvaluationProgress(uploadId, setPhase);

    try {
      // Bounded inside the watch itself, so a socket that never connects delays
      // the upload by a couple of seconds at most rather than blocking it.
      await progress.ready;

      const evaluation = await createEvaluation({ questionPaper, answerSheet, uploadId });

      // The last stage only takes the bar to 85%; the upload answering is what
      // finishes it. The next route fetches on the server, so this screen stays
      // up for a moment yet - long enough for the bar to arrive rather than
      // being cut off short of the end.
      setComplete(true);

      // Deliberately stay in the extracting state through the navigation: the
      // next route fetches on the server, and dropping back to the form here
      // would flash the upload screen between the two.
      router.push(`/evaluations/${evaluation.evaluationId}`);
    } catch (err) {
      setExtracting(false);
      setPhase(null);
      setComplete(false);
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong while extracting. Please try again.',
      );
    } finally {
      // The evaluation is over either way, and the socket has nothing left to
      // report. `finally` rather than a success path, so a failed upload does
      // not leave a connection open behind it.
      progress.dispose();
    }
  }

  if (extracting) return <ExtractingState phase={phase} complete={complete} />;

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
            className="text-danger max-w-88 mt-4 text-center text-[0.85rem] leading-relaxed lg:max-w-md lg:text-[0.9rem]"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
