'use client';

import { useEffect, useRef } from 'react';

import { CloseIcon } from '@/components/ui/icons';

import { NAV_ITEMS, SidebarBrand, SidebarFooter, SidebarToolkitButton } from './SidebarContent';
import { SidebarNav } from './SidebarNav';

/**
 * The navigation drawer behind the mobile menu button.
 *
 * No Figma frame covers this state, so it reuses the sidebar's own content at
 * full width rather than inventing a second navigation: the drawer is the
 * sidebar, shown over the page instead of beside it.
 *
 * Kept unmounted while closed. It is the only thing on the page that can take
 * focus away from the document, so leaving it in the tree hidden would put a
 * whole navigation into the tab order of every mobile screen.
 */
export function MobileNav({
  open,
  activeHref,
  onClose,
}: {
  open: boolean;
  activeHref: string;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Where focus came from, so it can be handed back on close — otherwise
    // dismissing the drawer drops the caret at the top of the document.
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    // The page behind scrolls independently on mobile; without this, dragging
    // the drawer scrolls the content underneath it.
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      // Keep tabbing inside the drawer: it covers the page, so a focus ring
      // wandering onto what is behind it would be invisible.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable === undefined || focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        tabIndex={-1}
        className="bg-surface max-w-84 absolute inset-y-0 right-0 flex w-[85%] flex-col overflow-y-auto p-5 shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between pb-2 pl-1 pt-1">
          <SidebarBrand collapsed={false} />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="text-ink-subtle hover:text-ink grid size-9 cursor-pointer place-items-center rounded-full transition-colors"
          >
            <CloseIcon className="size-[1.1rem]" />
          </button>
        </div>

        <div className="mt-5">
          <SidebarToolkitButton collapsed={false} />
        </div>

        {/* Following a link should dismiss the drawer, not leave it covering
            the page that was just navigated to. */}
        <SidebarNav
          items={NAV_ITEMS}
          activeHref={activeHref}
          className="mt-8"
          onNavigate={onClose}
        />

        <SidebarFooter collapsed={false} activeHref={activeHref} onNavigate={onClose} />
      </div>
    </div>
  );
}
