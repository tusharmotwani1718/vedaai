import Image from 'next/image';

import {
  AssignmentsIcon,
  ClassroomIcon,
  ExamsIcon,
  HomeIcon,
  LibraryIcon,
  PanelCollapseIcon,
  SettingsIcon,
} from '@/components/ui/icons';

import { SidebarNav, type NavItem } from './SidebarNav';
import { SidebarSchoolCard } from './SidebarSchoolCard';

/**
 * The desktop sidebar: a white card floating on the grey canvas.
 *
 * Hidden below `lg`, where the mobile top bar takes over — see AppShell.
 */

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/home', icon: HomeIcon },
  { label: 'My Classroom', href: '/classroom', icon: ClassroomIcon },
  { label: 'Assignments', href: '/assignments', icon: AssignmentsIcon },
  { label: 'Exams', href: '/', icon: ExamsIcon },
  { label: 'My Library', href: '/library', icon: LibraryIcon },
];

const SETTINGS_ITEM: NavItem[] = [{ label: 'Settings', href: '/settings', icon: SettingsIcon }];

export function Sidebar({ activeHref = '/' }: { activeHref?: string }) {
  return (
    <aside className="bg-surface rounded-panel hidden w-76 shrink-0 flex-col p-5 lg:flex xl:w-[20rem]">
      {/* Brand lockup */}
      <div className="flex items-center justify-between pb-2 pl-1 pr-1 pt-1">
        <div className="flex items-center gap-2.5">
          <Image
            src="/assets/veda-ai-logo.png"
            alt=""
            width={40}
            height={40}
            className="size-9 rounded-[0.65rem]"
            priority
          />
          <span className="text-ink-strong text-[1.35rem] font-extrabold leading-none tracking-tight">
            VedaAI
          </span>
        </div>

        <button
          type="button"
          aria-label="Collapse sidebar"
          className="text-ink-subtle hover:text-ink grid size-8 place-items-center rounded-lg transition-colors"
        >
          <PanelCollapseIcon className="size-5" />
        </button>
      </div>

      {/* Primary call to action */}
      <button
        type="button"
        className="bg-surface-dark border-brand text-ink-inverse mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-full border-2 text-[0.95rem] font-semibold transition-transform active:scale-[0.99]"
      >
        <Image
          src="/assets/icon-sidebar.png"
          alt=""
          width={28}
          height={28}
          className="size-5"
        />
        AI Teacher&rsquo;s Toolkit
      </button>

      <SidebarNav items={NAV_ITEMS} activeHref={activeHref} className="mt-8" />

      {/* Settings and the school card sit against the bottom edge */}
      <div className="mt-auto flex flex-col gap-4 pt-8">
        <SidebarNav items={SETTINGS_ITEM} activeHref={activeHref} />
        <SidebarSchoolCard name="Delhi Public School" location="Bokaro Steel City" />
      </div>
    </aside>
  );
}
