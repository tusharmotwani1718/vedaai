import Image from 'next/image';

import {
  AssignmentsIcon,
  ClassroomIcon,
  ExamsIcon,
  HomeIcon,
  LibraryIcon,
  SettingsIcon,
} from '@/components/ui/icons';

import { SidebarNav, type NavItem } from './SidebarNav';
import { SidebarSchoolCard } from './SidebarSchoolCard';

/**
 * Everything inside the sidebar, in either width.
 *
 * Shared by the desktop rail and the mobile drawer so the two cannot drift —
 * the drawer is simply this at full width. `collapsed` is the only thing that
 * varies: it drops the labels and centres what is left.
 */

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/home', icon: HomeIcon },
  { label: 'My Classroom', href: '/classroom', icon: ClassroomIcon },
  { label: 'Assignments', href: '/assignments', icon: AssignmentsIcon },
  { label: 'Exams', href: '/', icon: ExamsIcon },
  { label: 'My Library', href: '/library', icon: LibraryIcon },
];

export const SETTINGS_ITEM: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: SettingsIcon },
];

export function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
      <Image
        src="/assets/veda-ai-logo.png"
        alt=""
        width={40}
        height={40}
        className={collapsed ? 'size-8 rounded-[0.6rem]' : 'size-9 rounded-[0.65rem]'}
        priority
      />
      {!collapsed && (
        <span className="text-ink-strong text-[1.35rem] font-extrabold leading-none tracking-tight">
          VedaAI
        </span>
      )}
    </div>
  );
}

/**
 * The toolkit call to action.
 *
 * Collapsed it becomes the ringed circle from the reference rather than a
 * squeezed pill — the orange ring is what still reads as "primary" once the
 * label is gone.
 */
export function SidebarToolkitButton({ collapsed }: { collapsed: boolean }) {
  return (
    <button
      type="button"
      title={collapsed ? "AI Teacher's Toolkit" : undefined}
      aria-label={collapsed ? "AI Teacher's Toolkit" : undefined}
      className={[
        'bg-surface-dark border-brand text-ink-inverse flex shrink-0 items-center justify-center border-2',
        'transition-transform active:scale-[0.99]',
        collapsed
          ? 'size-11.5 mx-auto rounded-full'
          : 'h-13 w-full gap-2 rounded-full text-[0.95rem] font-semibold',
      ].join(' ')}
    >
      <Image src="/assets/icon-sidebar.png" alt="" width={28} height={28} className="size-5" />
      {!collapsed && "AI Teacher's Toolkit"}
    </button>
  );
}

/**
 * The lower block: settings, then the school badge.
 *
 * The reference's collapsed rail shows only the crest here, but Settings is
 * kept: it is a navigation destination, and dropping it would make the page
 * unreachable while the sidebar is collapsed rather than merely hidden.
 */
export function SidebarFooter({
  collapsed,
  activeHref,
  onNavigate,
}: {
  collapsed: boolean;
  activeHref: string;
  /** Lets the mobile drawer close itself when Settings is followed. */
  onNavigate?: () => void;
}) {
  return (
    <div className={`mt-auto flex flex-col gap-4 ${collapsed ? 'pt-6' : 'pt-8'}`}>
      <SidebarNav
        items={SETTINGS_ITEM}
        activeHref={activeHref}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />

      {collapsed ? (
        <span
          title="Delhi Public School"
          className="bg-surface-sunken size-10.5 mx-auto grid place-items-center rounded-[0.7rem]"
        >
          <Image
            src="/assets/school.png"
            alt="Delhi Public School"
            width={40}
            height={40}
            className="size-8"
          />
        </span>
      ) : (
        <SidebarSchoolCard name="Delhi Public School" location="Bokaro Steel City" />
      )}
    </div>
  );
}
