/**
 * The waiting screen, shown for the whole life of `POST /api/evaluations`.
 *
 * That request runs two OCR calls and two LLM calls before it resolves, so this
 * is on screen for 30–120s. There is no progress to report — the API is a
 * single synchronous call with no intermediate state to poll — which is why the
 * reference shows a static mark and a warning rather than a bar.
 *
 * Unlike the upload screen, this one sits on its own white card filling the
 * content area (`specs/design/design-reference/extracting-state.png`).
 */
export function ExtractingState() {
  return (
    <div
      className="bg-surface rounded-panel min-h-125 flex h-full flex-col items-center justify-center px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <ExtractingSparkle />

      <h1 className="text-ink mt-7 text-2xl font-bold tracking-[-0.04em]">Extracting&hellip;</h1>
      <p className="text-ink-muted text-lead mt-2">This may take a while</p>
    </div>
  );
}

/*
 * The sparkle cluster.
 *
 * Every number here was measured off the 2x reference rather than eyeballed:
 * the orange pixels were segmented into connected components to get each mark's
 * centre and radius, and the coordinates below are that geometry divided by the
 * export's 1.325x scale — so one viewBox unit is one CSS pixel.
 *
 * All three marks are the same four-point shape at different sizes. Each
 * quadrant is one cubic from an axis tip to the next, and CONTROL_* is where
 * its control points sit as a fraction of the radius. Those two numbers set how
 * concave the arms are; they were fitted by rasterizing candidate curves and
 * maximising pixel overlap with the export (92% agreement, against ~85% for the
 * obvious guess of control points sitting on the axes).
 */
const CONTROL_NEAR = 0.2;
const CONTROL_FAR = 0.36;

/** Trims binary-float noise so the emitted path stays readable in the DOM. */
const round = (n: number): string => String(Math.round(n * 100) / 100);

/** One four-point mark, centred on (cx, cy) with its tips `r` from the centre. */
function sparklePath(cx: number, cy: number, r: number): string {
  const near = CONTROL_NEAR * r;
  const far = CONTROL_FAR * r;

  // Walk the four quadrants by rotating the same control polygon 90° each time.
  let quad = [
    [0, -r],
    [near, -far],
    [far, -near],
    [r, 0],
  ];
  const point = ([x, y]: number[]): string => `${round(cx + x!)},${round(cy + y!)}`;
  const parts = [`M${round(cx)},${round(cy - r)}`];

  for (let i = 0; i < 4; i++) {
    const [, p1, p2, p3] = quad as [number[], number[], number[], number[]];
    parts.push(`C${point(p1)} ${point(p2)} ${point(p3)}`);
    quad = quad.map(([x, y]) => [-y!, x!]);
  }

  return `${parts.join(' ')} Z`;
}

/* Constant geometry — built once, not on every render. */
const MARKS = {
  large: sparklePath(55.8, 36.2, 35.8),
  medium: sparklePath(26.8, 81.1, 27.2),
  small: sparklePath(77, 81.1, 10.8),
};

function ExtractingSparkle() {
  return (
    <svg
      /* The cluster's own bounding box, with a unit of bleed: the lower-left
         mark and the dot each overhang it by a fraction, and the outer <svg>
         clips to the viewBox. */
      viewBox="-1 -1 95 111"
      className="h-[6.9rem] w-[5.9rem] shrink-0"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/*
         * Radial, not flat: each mark is solid brand orange out to about half
         * its radius, then fades to a pale peach that it reaches just before
         * the tips. Both stops were fitted against colours sampled along the
         * arms — mean error 1.2/255 across the large mark.
         */}
        <radialGradient id="veda-sparkle-lg">
          <stop offset="54%" stopColor="#ff5623" />
          <stop offset="95%" stopColor="#ffdbd0" />
        </radialGradient>
        {/* The small mark never reaches full saturation in the reference. */}
        <radialGradient id="veda-sparkle-sm">
          <stop offset="40%" stopColor="#ffa88d" />
          <stop offset="100%" stopColor="#ffd8cb" />
        </radialGradient>
      </defs>

      <path d={MARKS.large} fill="url(#veda-sparkle-lg)" />
      <path d={MARKS.medium} fill="url(#veda-sparkle-lg)" />
      <path d={MARKS.small} fill="url(#veda-sparkle-sm)" />

      {/* the loose dot, upper left */}
      <circle cx="5.3" cy="41.5" r="5.7" fill="#ff8c69" />
    </svg>
  );
}
