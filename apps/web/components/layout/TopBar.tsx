import { ChevronDownIcon, ExamsIcon, SparkleIcon } from '@/components/ui/icons';

import { ArrowLeft, CircleQuestionMark, Bell } from 'lucide-react';
import Image from 'next/image';

/** A bell with the unread dot from the reference. */
function NotificationBell() {
  return (
    <button
      type="button"
      aria-label="Notifications"
      className="hover:bg-surface-sunken relative grid size-9 place-items-center rounded-full transition-colors"
    >
      <Bell size={20} />
      <span className="bg-brand ring-surface-raised absolute right-1.5 top-1 size-2 rounded-full ring-2" />
    </button>
  );
}

/**
 * Desktop top bar: breadcrumb on the left, account controls on the right.
 * Hidden below `lg`, where MobileTopBar replaces it.
 */
export function TopBar({ section, userName }: { section: string; userName: string }) {
  return (
    <header className="bg-surface-raised rounded-panel hidden h-16 shrink-0 items-center gap-3 pl-4 pr-3 lg:flex">
      <button
        type="button"
        aria-label="Go back"
        className="text-ink hover:bg-surface-sunken grid size-9 place-items-center rounded-full transition-colors"
      >
        <ArrowLeft />
      </button>

      <span className="text-ink-muted flex items-center gap-2 text-[0.95rem] font-medium">
        <ExamsIcon className="size-[1.05rem]" />
        {section}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          aria-label="Help"
          className="text-ink hover:bg-surface-sunken grid size-9 place-items-center rounded-full transition-colors"
        >
          <CircleQuestionMark />
        </button>

        <NotificationBell />

        <button
          type="button"
          aria-label="AI assistant"
          className="text-ink hover:bg-surface-sunken grid size-9 place-items-center rounded-full transition-colors"
        >
          <SparkleIcon className="size-5" />
        </button>

        <button
          type="button"
          className="hover:bg-surface-sunken ml-1 flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors"
        >
          <Image
            src={'/assets/user.jpg'}
            alt="User avatar"
            width={32}
            height={32}
            className="size-7 rounded-full"
          />
          <ChevronDownIcon className="text-ink-muted size-4" />
        </button>
      </div>
    </header>
  );
}
