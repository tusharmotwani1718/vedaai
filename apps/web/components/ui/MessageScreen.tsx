import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * A full-pane message with one way forward.
 *
 * The shape every dead end in the app shares: a 404, an evaluation the
 * in-memory store has already dropped. They looked identical written twice, so
 * the card lives here and only the words differ.
 */
export function MessageScreen({
  title,
  children,
  actionHref,
  actionLabel,
}: {
  title: string;
  children: ReactNode;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="bg-surface rounded-panel min-h-125 flex h-full flex-col items-center justify-center px-6 text-center">
      <h1 className="text-ink text-2xl font-bold tracking-[-0.04em]">{title}</h1>
      <p className="text-ink-muted text-lead mt-2 max-w-md">{children}</p>

      <Link
        href={actionHref}
        className="bg-surface-dark text-ink-inverse mt-7 flex h-[3.4rem] items-center rounded-full px-8 text-[1.05rem] font-semibold hover:brightness-125"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
