import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/**
 * A vertical list of sidebar links.
 *
 * Shared by the main nav and the lone Settings row so both stay identical when
 * the row styling changes.
 */
export function SidebarNav({
  items,
  activeHref,
  className = '',
}: {
  items: NavItem[];
  activeHref: string;
  className?: string;
}) {
  return (
    <nav className={className}>
      <ul className="flex flex-col gap-1">
        {items.map(({ label, href, icon: IconComponent }) => {
          const isActive = href === activeHref;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex h-[2.9rem] items-center gap-3 rounded-xl px-3 text-[0.95rem] transition-colors',
                  isActive
                    ? 'bg-surface-sunken text-ink font-semibold'
                    : 'text-ink-muted hover:bg-surface-sunken/60 hover:text-ink font-medium',
                ].join(' ')}
              >
                <IconComponent className="size-[1.15rem] shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
