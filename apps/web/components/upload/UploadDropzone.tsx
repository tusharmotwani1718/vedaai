'use client';

import { useId } from 'react';

import { UploadIcon } from '@/components/ui/icons';

import { FileChip } from './FileChip';

/**
 * One dashed upload card, in either of its two states.
 *
 * Empty, it is a `<label>` wrapping a hidden file input, so the whole card is
 * clickable and reachable by keyboard without any JS of its own. Filled, it
 * shows the file chip instead — and stops being a label, since clicking a
 * chosen file should not reopen the picker; the remove button does that job.
 */
export function UploadDropzone({
  label,
  highlight,
  accept,
  file,
  meta,
  onSelect,
  onRemove,
  maxSizeLabel = 'Max 10MB',
}: {
  /** Leading dark text, e.g. "Upload". */
  label: string;
  /** Trailing orange text naming the document, e.g. "Question Paper". */
  highlight: string;
  accept: string;
  file: File | null;
  /** Pre-formatted meta line for the chip, e.g. "2MB  •  2 Pages". */
  meta: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
  maxSizeLabel?: string;
}) {
  const inputId = useId();

  const shell =
    'bg-surface border-border-dashed rounded-card flex flex-1 flex-col items-center justify-center border-2 border-dashed px-3 py-4 text-center transition-colors lg:py-6';

  if (file !== null) {
    return (
      <div className={shell}>
        <div className="w-full px-2 lg:px-4">
          <FileChip fileName={file.name} meta={meta} onRemove={onRemove} />
        </div>
      </div>
    );
  }

  return (
    <label htmlFor={inputId} className={`${shell} hover:border-brand/50 cursor-pointer`}>
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const chosen = event.target.files?.[0];
          if (chosen) onSelect(chosen);
          // Reset so picking the same file again after removing it still fires.
          event.target.value = '';
        }}
      />

      <span className="bg-surface-tile rounded-tile text-ink grid size-12 place-items-center">
        <UploadIcon className="size-[1.35rem]" />
      </span>

      <span className="text-card-title mt-4 block lg:mt-2">
        <span className="text-ink">{label} </span>
        <span className="text-brand">{highlight}</span>
      </span>

      <span className="text-ink-subtle text-card-hint mt-1 block">{maxSizeLabel}</span>
    </label>
  );
}
