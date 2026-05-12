'use client';

import { GlobalSearch } from '@/components/shared/global-search';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { NotificationsPopover } from '@/components/shared/notifications';
import { LiveEventsPanel } from '@/components/shared/live-events';

export function Header() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <GlobalSearch />
      <div className="flex items-center gap-2">
        <LiveEventsPanel />
        <NotificationsPopover />
        <ThemeToggle />
      </div>
    </header>
  );
}
