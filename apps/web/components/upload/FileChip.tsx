import { CloseIcon } from '@/components/ui/icons';

/**
 * The chosen-file chip that replaces a dropzone's empty content.
 *
 * The remove button deliberately overhangs the chip's top-right corner, as in
 * the reference — hence `overflow-visible` on the wrapper and the small
 * translate on the button.
 */
export function FileChip({
  fileName,
  meta,
  onRemove,
}: {
  fileName: string;
  /** Pre-formatted, e.g. "2MB  •  2 Pages". */
  meta: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative w-full">
      <div className="bg-surface-chip flex w-full items-center gap-3 rounded-2xl px-3 py-2.5">
        <PdfBadge />

        <span className="min-w-0 flex-1 text-center">
          <span className="text-ink text-card-title block truncate">{fileName}</span>
          <span className="text-ink-faint text-card-hint mt-0.5 block">{meta}</span>
        </span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${fileName}`}
        className="bg-close text-ink-inverse absolute right-0 top-0 grid size-6 -translate-y-[28%] translate-x-[35%] place-items-center rounded-full transition-opacity hover:opacity-90"
      >
        <CloseIcon className="size-3.5" />
      </button>
    </div>
  );
}

/** Red document mark with a folded corner and a "PDF" label. */
function PdfBadge() {
  return (
    <span className="text-pdf relative grid h-8 w-7 shrink-0 place-items-end justify-items-center">
      <svg viewBox="0 0 28 32" className="absolute inset-0 size-full" aria-hidden="true">
        <path
          d="M3 0h14l11 11v18a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3z"
          fill="currentColor"
        />
        <path d="M17 0l11 11h-8a3 3 0 0 1-3-3z" fill="#fff" fillOpacity="0.35" />
      </svg>
      <span className="text-ink-inverse relative pb-1 text-[0.5rem] font-bold leading-none tracking-tight">
        PDF
      </span>
    </span>
  );
}
