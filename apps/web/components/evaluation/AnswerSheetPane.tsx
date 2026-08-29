'use client';

import type { DocumentPayload, PageRect } from '@vedaai/shared';

import { ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/icons';

import { DocumentPage } from './DocumentPage';

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

/**
 * The right pane: the uploaded answer sheet itself, under a dark toolbar.
 *
 * This shows the real document rather than a reconstruction of it — the point
 * of the screen is that a teacher reads the student's own handwriting, with the
 * mapped answer boxed on top of it.
 */
export function AnswerSheetPane({
  document,
  pageIndex,
  pageCount,
  zoom,
  rects,
  label,
  onPageChange,
  onZoomChange,
}: {
  document: DocumentPayload;
  pageIndex: number;
  pageCount: number;
  zoom: number;
  rects: PageRect[];
  label: string | null;
  onPageChange: (pageIndex: number) => void;
  onZoomChange: (zoom: number) => void;
}) {
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pageCount - 1;

  return (
    <div className="rounded-panel bg-toolbar flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-3 px-4 py-3 lg:px-5">
        <h2 className="text-ink-inverse mr-auto text-[0.95rem] font-bold">Answer Sheet</h2>

        <div className="bg-toolbar-control text-ink-inverse flex items-center gap-1 rounded-xl px-1 py-1">
          <ToolbarButton
            label="Zoom out"
            disabled={zoom <= ZOOM_MIN}
            onClick={() => onZoomChange(Math.max(ZOOM_MIN, zoom - ZOOM_STEP))}
          >
            &minus;
          </ToolbarButton>
          <span className="min-w-13 text-center text-[0.85rem] font-semibold tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <ToolbarButton
            label="Zoom in"
            disabled={zoom >= ZOOM_MAX}
            onClick={() => onZoomChange(Math.min(ZOOM_MAX, zoom + ZOOM_STEP))}
          >
            +
          </ToolbarButton>
        </div>

        <div className="bg-toolbar-control text-ink-inverse flex items-center gap-1 rounded-xl px-1 py-1">
          <ToolbarButton
            label="Previous page"
            disabled={!canPrev}
            onClick={() => onPageChange(pageIndex - 1)}
          >
            <ArrowLeftIcon className="size-[0.95rem]" />
          </ToolbarButton>
          <span className="whitespace-nowrap px-1 text-[0.85rem] font-semibold">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <ToolbarButton
            label="Next page"
            disabled={!canNext}
            onClick={() => onPageChange(pageIndex + 1)}
          >
            <ArrowRightIcon className="size-[0.95rem]" />
          </ToolbarButton>
        </div>
      </div>

      {/* The document scrolls inside the pane; the toolbar stays put. Zooming
          past 100% widens the page, so this scrolls in both directions. */}
      <div className="bg-surface min-h-0 flex-1 overflow-auto">
        <DocumentPage
          url={document.url}
          mimeType={document.mimeType}
          pageIndex={pageIndex}
          zoom={zoom}
          rects={rects}
          label={label}
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-6 cursor-pointer place-items-center rounded-lg text-[1rem] leading-none hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
