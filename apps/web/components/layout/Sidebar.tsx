'use client';

import { ChevronsRight } from 'lucide-react';
import { useState } from 'react';

import { PanelCollapseIcon } from '@/components/ui/icons';

import { NAV_ITEMS, SidebarBrand, SidebarFooter, SidebarToolkitButton } from './SidebarContent';
import { SidebarNav } from './SidebarNav';

/**
 * The desktop sidebar: a white card floating on the grey canvas.
 *
 * Hidden below `lg`, where the mobile drawer takes over — see AppShell.
 *
 * Collapsing is plain local state, owned here rather than by AppShell because
 * only this element's own width changes; the main column is a flex sibling and
 * reflows on its own. Nothing is persisted, so the sidebar starts expanded on
 * every page — and each width carries its own control, the panel button beside
 * the wordmark to collapse and the "»" at the foot of the rail to expand.
 */
export function Sidebar({ activeHref = '/' }: { activeHref?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((current) => !current);

  return (
    <aside
      className={[
        'bg-surface rounded-panel hidden shrink-0 flex-col lg:flex',
        // 56px, measured off the collapsed rail in extracting-state-03.png and
        // split-view-documents-04.png. The padding is thin because the toolkit
        // circle inside it is 46px and nearly fills the rail.
        collapsed ? 'w-14 px-1 py-3' : 'w-76 p-5 xl:w-[20rem]',
      ].join(' ')}
    >
      <div
        className={
          collapsed
            ? 'flex flex-col items-center gap-4 pt-1'
            : 'flex items-center justify-between pb-2 pl-1 pr-1 pt-1'
        }
      >
        <SidebarBrand collapsed={collapsed} />

        {!collapsed && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Collapse sidebar"
            aria-expanded
            className="text-ink-subtle hover:text-ink grid size-8 cursor-pointer place-items-center rounded-lg transition-colors"
          >
            <PanelCollapseIcon className="size-5" />
          </button>
        )}
      </div>

      <div className={collapsed ? 'mt-4' : 'mt-5'}>
        <SidebarToolkitButton collapsed={collapsed} />
      </div>

      <SidebarNav
        items={NAV_ITEMS}
        activeHref={activeHref}
        collapsed={collapsed}
        className={collapsed ? 'mt-6' : 'mt-8'}
      />

      <SidebarFooter collapsed={collapsed} activeHref={activeHref} />

      {/*
       * The way back out. The reference puts this at the foot of the rail as a
       * "»" rather than beside the logo — there is no room next to a centred
       * mark, and the arrows point the way it will grow.
       */}
      {collapsed && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Expand sidebar"
          aria-expanded={false}
          className="text-ink hover:bg-surface-sunken mx-auto mt-3 grid size-8 cursor-pointer place-items-center rounded-lg transition-colors"
        >
          <ChevronsRight size={18} strokeWidth={2.5} />
        </button>
      )}
    </aside>
  );
}
