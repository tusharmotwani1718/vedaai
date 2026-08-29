import Image from 'next/image';
import type { ComponentType, SVGProps } from 'react';

import { ClockIcon, CloudIcon, GearIcon, ListCardIcon } from '@/components/ui/icons';

/**
 * Heading, subtitle and the ringed illustration above the dropzones.
 *
 * The two references differ here, so this is not only a size change: on desktop
 * "Question Paper & Answer Sheets" is orange on a soft wash, while on mobile the
 * whole heading is plain dark with no wash at all. The colour and its padding
 * are therefore `lg:` only.
 *
 * `box-decoration-clone` keeps the wash correct if the phrase ever wraps.
 */
export function UploadHero() {
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-ink text-display-sm lg:text-display text-center">
        <span>Upload </span>
        <span className="lg:bg-brand-wash lg:text-brand rounded-lg box-decoration-clone lg:px-2 lg:py-0.5">
          Question Paper &amp; Answer Sheets
        </span>
      </h1>

      {/* The desktop reference shows this line; mobile drops it. */}
      <p className="text-ink-muted text-lead mt-4 hidden lg:block">
        Upload both files to get started
      </p>

      <HeroIllustration className="mt-6 lg:mt-7" />
    </div>
  );
}

/*
 * Geometry, all measured off `specs/design/design-reference/upload-empty-state-01.png`
 * and expressed as percentages of the illustration box so it scales freely.
 *
 * The reference box is 162px across:
 *   outer ring   r 81  -> inset 0
 *   middle ring  r 63  -> inset 11.1%
 *   white disc   r 45  -> inset 22.2%
 */
const DISC_INSET = '22.2%';
const DISC_RADIUS = '27.8%'; // 45 / 162

/**
 * Where the portrait sits inside the box.
 *
 * Derived by matching three features against the reference — the top of her
 * hair, her chin, and the top edge of the book — which put the source image at
 * ~9% scale. These three numbers are the only things to nudge if the framing
 * looks off.
 */
const PORTRAIT = { width: '71%', left: '14.6%', top: '8.6%' };

const BADGES: Array<{ icon: ComponentType<SVGProps<SVGSVGElement>>; left: string; top: string }> = [
  { icon: ClockIcon, left: '64.8%', top: '14.2%' },
  { icon: ListCardIcon, left: '13.4%', top: '38.0%' },
  { icon: CloudIcon, left: '88.5%', top: '65.2%' },
  { icon: GearIcon, left: '33.9%', top: '86.0%' },
];

/**
 * Two concentric peach rings, a white disc, the portrait, and four orbiting
 * badges.
 *
 * The portrait is rendered twice on purpose. In the reference her hair breaks
 * out above the white disc onto the ring, while her shoulders and the book are
 * clipped by the disc — so the visible shape is "disc plus a strip above it",
 * which no single clip can express. One copy is clipped to the disc, the other
 * to the strip above it; together they reproduce it exactly. The browser
 * downloads the file once.
 */
function HeroIllustration({ className = '' }: { className?: string }) {
  return (
    <div className={`relative size-20 shrink-0 lg:size-32 ${className}`} aria-hidden="true">
      {/* rings */}
      <span className="bg-brand-ring-soft absolute inset-0 rounded-full" />
      <span className="bg-brand-ring absolute inset-[11.1%] rounded-full" />
      <span className="bg-surface absolute rounded-full" style={{ inset: DISC_INSET }} />

      {/* the strip above the disc, where her hair shows over the ring */}
      <span
        className="absolute inset-0 block"
        style={{ clipPath: `inset(0 0 ${100 - parseFloat(DISC_INSET)}% 0)` }}
      >
        <Portrait />
      </span>

      {/* everything inside the disc */}
      <span
        className="absolute inset-0 block"
        style={{ clipPath: `circle(${DISC_RADIUS} at 50% 50%)` }}
      >
        <Portrait />
      </span>

      {BADGES.map(({ icon: BadgeGlyph, left, top }) => (
        <span
          key={`${left}-${top}`}
          className="bg-brand text-ink-inverse absolute grid size-[8.8%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
          style={{ left, top }}
        >
          <BadgeGlyph className="size-[65%]" />
        </span>
      ))}
    </div>
  );
}

function Portrait() {
  return (
    <Image
      src="/assets/teacher-icon.png"
      alt=""
      width={1280}
      height={1280}
      priority
      /* Rendered ~120px wide. Without this hint Next serves a variant sized for
         the 1280px intrinsic width — half a megabyte for a decoration. */
      sizes="160px"
      className="absolute max-w-none"
      style={{ width: PORTRAIT.width, left: PORTRAIT.left, top: PORTRAIT.top, height: 'auto' }}
    />
  );
}
