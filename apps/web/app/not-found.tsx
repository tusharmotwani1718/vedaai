import { AppShell } from '@/components/layout/AppShell';
import { MessageScreen } from '@/components/ui/MessageScreen';

/**
 * Rendered for any URL that matches no route.
 *
 * Reachable in practice, not just in theory: the sidebar shows sections that
 * have no page behind them yet, and although those rows are blocked from being
 * clicked, the addresses can still be typed or arrive from an old link.
 *
 * It keeps the app shell rather than standing alone, so a wrong turn still
 * leaves the navigation in reach. `activeHref` is deliberately unmatched -
 * nothing in the sidebar is the current page here.
 */
export default function NotFound() {
  return (
    <AppShell section="Exams" userName="Madhur Rastogi" activeHref="">
      <MessageScreen title="This page does not exist" actionHref="/" actionLabel="Go to Exams">
        Only the Exams section is built so far. Everything else in the sidebar is on its way.
      </MessageScreen>
    </AppShell>
  );
}
