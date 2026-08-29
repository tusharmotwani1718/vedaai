import {
  ArrowLeftIcon,
  BellIcon,
  ChevronDownIcon,
  ExamsIcon,
  HelpIcon,
  SparkleIcon,
} from '@/components/ui/icons';

/** A bell with the unread dot from the reference. */
function NotificationBell() {
  return (
    <button
      type="button"
      aria-label="Notifications"
      className="text-ink hover:bg-surface-sunken relative grid size-9 place-items-center rounded-full transition-colors"
    >
      <BellIcon className="size-[1.15rem]" />
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
        <ArrowLeftIcon className="size-[1.2rem]" />
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
          <HelpIcon className="size-[1.2rem]" />
        </button>

        <NotificationBell />

        <button
          type="button"
          aria-label="AI assistant"
          className="text-ink hover:bg-surface-sunken grid size-9 place-items-center rounded-full transition-colors"
        >
          <SparkleIcon className="size-[1.15rem]" />
        </button>

        <button
          type="button"
          className="hover:bg-surface-sunken ml-1 flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors"
        >
          <span
            aria-hidden="true"
            className="bg-surface-sunken text-ink-muted grid size-9 place-items-center rounded-full text-[0.7rem] font-bold"
          >
            {userName
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)}
          </span>
          <span className="text-ink text-[0.95rem] font-semibold">{userName}</span>
          <ChevronDownIcon className="text-ink-muted size-4" />
        </button>
      </div>
    </header>
  );
}
