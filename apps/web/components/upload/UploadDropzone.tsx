import { UploadIcon } from '@/components/ui/icons';

/**
 * One dashed upload card.
 *
 * Presentational for now — the empty state is the only screen built. It already
 * takes the props the uploaded state will need (`onSelect`, `accept`), so
 * wiring the file input later does not change its shape.
 */
export function UploadDropzone({
  label,
  highlight,
  maxSizeLabel = 'Max 10MB',
}: {
  /** Leading dark text, e.g. "Upload". */
  label: string;
  /** Trailing orange text naming the document, e.g. "Question Paper". */
  highlight: string;
  maxSizeLabel?: string;
}) {
  return (
    <div className="bg-surface border-border-dashed rounded-card flex flex-1 flex-col items-center justify-center border-2 border-dashed px-3 py-4 text-center transition-colors lg:py-6">
      <span className="bg-surface-tile rounded-tile text-ink grid size-12 place-items-center">
        <UploadIcon className="size-[1.35rem]" />
      </span>

      <p className="text-card-title mt-4 lg:mt-2">
        <span className="text-ink">{label} </span>
        <span className="text-brand">{highlight}</span>
      </p>

      <p className="text-ink-subtle text-card-hint mt-1">{maxSizeLabel}</p>
    </div>
  );
}
