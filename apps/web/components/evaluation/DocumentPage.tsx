'use client';

import { useEffect, useRef, useState } from 'react';
import type { RenderTask } from 'pdfjs-dist';
import type { PageRect } from '@vedaai/shared';

/**
 * One page of the answer sheet, with the highlight rectangles drawn over it.
 *
 * PDFs are rendered to a canvas by pdf.js rather than handed to the browser's
 * built-in viewer. That is the whole reason the dependency is here: the native
 * viewer renders in an opaque frame that nothing can be positioned over, and
 * highlighting the answer is the feature. Images need no such machinery and are
 * just an `<img>` with the same overlay.
 *
 * Rects arrive normalized 0–1 (see `Region` in the shared types), so they are
 * expressed as percentages and hold at any zoom without recomputation.
 */
export function DocumentPage({
  url,
  mimeType,
  pageIndex,
  zoom,
  rects,
  label,
}: {
  url: string;
  mimeType: string;
  pageIndex: number;
  /** 1 = fit the pane's width. */
  zoom: number;
  /** Only the rects on this page. */
  rects: PageRect[];
  /** Tag shown against the first rect, e.g. "Q2". */
  label: string | null;
}) {
  const isPdf = mimeType === 'application/pdf';

  return (
    <div className="flex justify-center p-4">
      <div className="relative shrink-0" style={{ width: `${zoom * 100}%` }}>
        {isPdf ? (
          <PdfCanvas url={url} pageIndex={pageIndex} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element -- served by the
             API from a runtime id, so there is nothing for the optimizer to
             statically resolve. */
          <img src={url} alt="" className="block w-full" />
        )}

        <HighlightOverlay rects={rects} label={label} />
      </div>
    </div>
  );
}

/** Normalized fraction -> a CSS percentage, without binary-float noise. */
const pct = (fraction: number): string => `${Math.round(fraction * 1e6) / 1e4}%`;

/** The translucent green boxes, plus the question tag on the first one. */
function HighlightOverlay({ rects, label }: { rects: PageRect[]; label: string | null }) {
  if (rects.length === 0) return null;

  // The tag hangs off the top-left of the topmost rect, so it reads as a label
  // for the whole answer rather than for one fragment of it.
  const anchor = rects.reduce((top, r) => (r.y0 < top.y0 ? r : top), rects[0]!);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {rects.map((rect, i) => (
        <span
          key={`${rect.page}-${rect.x0}-${rect.y0}-${i}`}
          className="border-highlight-edge bg-highlight/25 absolute rounded-md border-2"
          style={{
            left: pct(rect.x0),
            top: pct(rect.y0),
            width: pct(rect.x1 - rect.x0),
            height: pct(rect.y1 - rect.y0),
          }}
        />
      ))}

      {label !== null && (
        <span
          className="bg-mark-pass text-ink-inverse absolute -translate-y-full rounded-t-md px-2 py-0.5 text-[0.8rem] font-semibold"
          style={{ left: pct(anchor.x0), top: pct(anchor.y0) }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * pdf.js is loaded lazily and only in the browser: it is well over a megabyte
 * and pulls in a worker, none of which should touch the server render or the
 * initial bundle.
 */
async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  return pdfjs;
}

function PdfCanvas({ url, pageIndex }: { url: string; pageIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * One piece of state, stamped with what it describes.
   *
   * Resetting a separate `ready`/`error` pair at the top of the effect would set
   * state synchronously during the effect and cascade an extra render on every
   * page change. Comparing against `renderKey` instead means a stale result is
   * simply not current, and no reset is needed.
   */
  const renderKey = `${url}#${pageIndex}`;
  const [outcome, setOutcome] = useState<{ key: string; error: string | null } | null>(null);
  const current = outcome?.key === renderKey ? outcome : null;
  const error = current?.error ?? null;
  const ready = current !== null && current.error === null;

  useEffect(() => {
    // `cancelled` guards the async chain; `task` is the in-flight pdf.js render,
    // which must be cancelled explicitly or two renders can race onto the same
    // canvas and interleave their output.
    let cancelled = false;
    let task: RenderTask | null = null;

    void (async () => {
      try {
        const pdfjs = await loadPdfjs();
        const pdf = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;

        const page = await pdf.getPage(pageIndex + 1);
        const canvas = canvasRef.current;
        if (cancelled || canvas === null) return;

        // Render at twice the page's natural size and let CSS scale it into the
        // pane. The canvas is then denser than the display, so zooming in stays
        // sharp without re-rendering on every step.
        const viewport = page.getViewport({ scale: 2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        task = page.render({ canvas, viewport });
        await task.promise;
        if (!cancelled) setOutcome({ key: renderKey, error: null });
      } catch (err) {
        // A cancelled render rejects; that is not a failure worth showing.
        if (cancelled || (err as { name?: string }).name === 'RenderingCancelledException') return;
        setOutcome({ key: renderKey, error: 'This page could not be rendered.' });
      }
    })();

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [url, pageIndex, renderKey]);

  if (error !== null) {
    return (
      <div className="text-ink-muted min-h-100 grid place-items-center text-center text-[0.9rem]">
        <span>
          {error}{' '}
          <a href={url} target="_blank" rel="noreferrer" className="text-brand underline">
            Open the file directly
          </a>
        </span>
      </div>
    );
  }

  return (
    <>
      <canvas ref={canvasRef} className="block w-full" />
      {!ready && (
        <div className="text-ink-faint absolute inset-0 grid place-items-center text-[0.9rem]">
          Rendering page {pageIndex + 1}&hellip;
        </div>
      )}
    </>
  );
}
