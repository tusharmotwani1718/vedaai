'use client';

import Image from 'next/image';
import { useState } from 'react';

import { ArrowLeftIcon, BellIcon, MenuIcon } from '@/components/ui/icons';

import { MobileNav } from './MobileNav';

/**
 * Mobile header: back arrow and wordmark on the left, notifications, avatar and
 * the menu trigger on the right. Replaced by Sidebar + TopBar from `lg` up.
 *
 * The menu button opens the navigation drawer, and the open state lives here
 * rather than in AppShell because nothing else on the page depends on it.
 */
export function MobileTopBar({
  userName,
  activeHref = '/',
}: {
  userName: string;
  activeHref?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  return (
    <header className="bg-surface rounded-panel flex h-16 shrink-0 items-center gap-2 px-3 lg:hidden">
      <button
        type="button"
        aria-label="Go back"
        className="text-ink grid size-9 shrink-0 place-items-center rounded-full"
      >
        <ArrowLeftIcon className="size-[1.3rem]" />
      </button>

      <span className="flex items-center gap-2">
        <Image
          src="/assets/veda-ai-logo.png"
          alt=""
          width={32}
          height={32}
          className="size-7 rounded-lg sm:hidden"
          priority
        />
        <span className="text-ink-strong text-[1.2rem] font-extrabold leading-none tracking-tight">
          VedaAI
        </span>
      </span>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Notifications"
          className="bg-surface-sunken text-ink relative grid size-10 place-items-center rounded-full"
        >
          <BellIcon className="size-[1.15rem]" />
          <span className="bg-brand ring-surface absolute right-2 top-1.5 size-2 rounded-full ring-2" />
        </button>

        <span
          aria-hidden="true"
          className="bg-surface-sunken text-ink-muted grid size-10 place-items-center rounded-full text-[0.7rem] font-bold"
        >
          {initials}
        </span>

        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          onClick={() => setMenuOpen(true)}
          className="text-ink hover:bg-surface-sunken grid size-9 cursor-pointer place-items-center rounded-full transition-colors"
        >
          <MenuIcon className="size-[1.35rem]" />
        </button>
      </div>

      <MobileNav open={menuOpen} activeHref={activeHref} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
