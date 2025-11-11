'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clapperboard, Tv, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/my-list', label: 'My List', icon: Clapperboard },
  { href: '/watched', label: 'Watched', icon: Tv },
  { href: '/profile', label: 'Profile', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  // Hide nav on admin pages
  if (isAdmin) {
    return null;
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50">
      <nav className="grid h-full grid-cols-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
