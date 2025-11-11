import type { ReactNode } from 'react';
import { Header } from './header';
import { MobileNav } from './mobile-nav';
import { SidebarNav } from './sidebar-nav';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <SidebarNav />
        <div className="flex flex-col flex-1 w-full">
          <Header />
          <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
