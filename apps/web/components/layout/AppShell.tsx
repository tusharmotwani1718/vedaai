import type { ReactNode } from 'react';

import { MobileTopBar } from './MobileTopBar';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/**
 * The application frame every screen renders inside.
 *
 * Two layouts from one tree rather than two: below `lg` the sidebar is hidden
 * and MobileTopBar shows; from `lg` up the sidebar appears and the desktop
 * TopBar takes over. Nothing is duplicated per breakpoint.
 *
 * The shell owns the page scroll on mobile and pins to the viewport on desktop,
 * so later screens (the split view) can scroll their panes independently.
 */
export function AppShell({
  children,
  section,
  userName,
  activeHref = '/',
}: {
  children: ReactNode;
  section: string;
  userName: string;
  activeHref?: string;
}) {
  return (
    <div className="canvas-wash flex min-h-dvh w-full gap-4 p-3 lg:h-dvh lg:gap-5 lg:p-5">
      <Sidebar activeHref={activeHref} />

      <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-5">
        <MobileTopBar userName={userName} activeHref={activeHref} />
        <TopBar section={section} userName={userName} />

        <main className="min-h-0 flex-1 lg:overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
