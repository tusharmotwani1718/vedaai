import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /**
   * Marks a destination that does not exist yet.
   *
   * The row still shows - the product has these sections and hiding them would
   * misrepresent it - but it does not navigate, because the only pages built so
   * far are Exams and the evaluation it opens. Without this, every other row is
   * a link straight to a 404.
   */
  disabled?: boolean;
}

const ROW_BASE = 'flex items-center transition-colors';

/**
 * A vertical list of sidebar links.
 *
 * Shared by the main nav and the lone Settings row so both stay identical when
 * the row styling changes.
 *
 * Collapsed, each row becomes a centred square tile. The label does not
 * disappear so much as move: it becomes the accessible name and the tooltip,
 * because an icon on its own tells a screen reader nothing and tells a new user
 * very little.
 */
export function SidebarNav({
  items,
  activeHref,
  collapsed = false,
  className = '',
  onNavigate,
}: {
  items: NavItem[];
  activeHref: string;
  collapsed?: boolean;
  className?: string;
  /** Lets the mobile drawer close itself when a link is followed. */
  onNavigate?: () => void;
}) {
  const shape = collapsed
    ? 'size-8 justify-center rounded-[0.6rem]'
    : 'h-[2.9rem] gap-3 rounded-xl px-3 text-[0.95rem]';

  return (
    <nav className={className}>
      <ul className={`flex flex-col ${collapsed ? 'items-center gap-2' : 'gap-1'}`}>
        {items.map(({ label, href, icon: IconComponent, disabled = false }) => {
          const glyph = (
            <>
              <IconComponent className="size-[1.15rem] shrink-0" />
              {!collapsed && label}
            </>
          );

          if (disabled) {
            return (
              <li key={href}>
                {/*
                 * A span, not a disabled link: there is nothing to navigate to,
                 * so it should not be focusable or announced as a link. The
                 * blocked state is carried by the cursor and the tooltip on
                 * hover, and by the faded ink at rest.
                 */}
                <span
                  aria-disabled="true"
                  title={`${label} is not available yet`}
                  className={`${ROW_BASE} ${shape} text-ink-subtle cursor-not-allowed select-none font-medium`}
                >
                  {glyph}
                </span>
              </li>
            );
          }

          const isActive = href === activeHref;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                aria-label={collapsed ? label : undefined}
                title={collapsed ? label : undefined}
                className={[
                  ROW_BASE,
                  shape,
                  isActive
                    ? 'bg-surface-sunken text-ink font-semibold'
                    : 'text-ink-muted hover:bg-surface-sunken/60 hover:text-ink font-medium',
                ].join(' ')}
              >
                {glyph}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
