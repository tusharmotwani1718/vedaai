'use client';

import { useEffect, useState } from 'react';

import { countPages, formatFileMeta } from '@/lib/file-meta';

import { UploadDropzone } from './UploadDropzone';

/** Mime types the API accepts — see SUPPORTED_UPLOAD_MIME_TYPES in the api app. */
const ACCEPT = 'application/pdf,image/png,image/jpeg,image/webp,image/avif';

export interface UploadSlot {
  file: File | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
}

/**
 * The recessed panel holding both dropzones.
 *
 * Side by side from `md` up, stacked below it — the only structural difference
 * between the desktop and mobile references.
 */
export function UploadPanel({
  questionPaper,
  answerSheet,
}: {
  questionPaper: UploadSlot;
  answerSheet: UploadSlot;
}) {
  const paperMeta = useFileMeta(questionPaper.file);
  const sheetMeta = useFileMeta(answerSheet.file);

  return (
    <div className="bg-surface-panel rounded-panel flex flex-col gap-3 p-3 md:flex-row lg:gap-4 lg:p-4">
      <UploadDropzone
        label="Upload"
        highlight="Question Paper"
        accept={ACCEPT}
        file={questionPaper.file}
        meta={paperMeta}
        onSelect={questionPaper.onSelect}
        onRemove={questionPaper.onRemove}
      />
      <UploadDropzone
        label="Upload"
        highlight="Answer Sheet"
        accept={ACCEPT}
        file={answerSheet.file}
        meta={sheetMeta}
        onSelect={answerSheet.onSelect}
        onRemove={answerSheet.onRemove}
      />
    </div>
  );
}

/**
 * Size is known synchronously, so it is derived during render; only the page
 * count needs the file read, so only that lives in state. The chip therefore
 * shows the size immediately and gains the page count a moment later, rather
 * than flashing a placeholder.
 *
 * The resolved count is stored alongside the File it came from. Choosing a
 * second file before the first finishes reading would otherwise label the new
 * file with the old file's page count.
 */
function useFileMeta(file: File | null): string {
  const [resolved, setResolved] = useState<{ file: File; pages: number | null } | null>(null);

  useEffect(() => {
    if (file === null) return;

    let active = true;
    void countPages(file).then((pages) => {
      if (active) setResolved({ file, pages });
    });

    return () => {
      active = false;
    };
  }, [file]);

  if (file === null) return '';
  const pages = resolved !== null && resolved.file === file ? resolved.pages : null;
  return formatFileMeta(file.size, pages);
}
