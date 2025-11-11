'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clapperboard, Tv, User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/my-list', label: 'My List', icon: Clapperboard },
  { href: '/watched', label: 'Watched', icon: Tv },
  { href: '/profile', label: 'Profile', icon: User },
];

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/movies', label: 'Content', icon: Clapperboard },
  { href: '/admin/users', label: 'Users', icon: User },
  { href: '/admin/genres', label: 'Genres', icon: Shield },
];


export function MobileNav() {
  const pathname = usePathname();
  const { appUser } = useUser();
  const isAdminPath = pathname.startsWith('/admin');

  const isSuperAdmin = appUser?.role === 'SUPER_ADMIN';

  const navItems = isAdminPath ? adminNavItems : mainNavItems;
  const gridCols = isSuperAdmin && !isAdminPath ? 'grid-cols-5' : 'grid-cols-4';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50">
      <nav className={cn('grid h-full', gridCols)}>
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
        {isSuperAdmin && !isAdminPath && (
           <Link
            href="/admin"
            className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                'text-muted-foreground hover:text-foreground'
            )}
           >
             <Shield className="h-5 w-5" />
             <span>Admin</span>
           </Link>
        )}
      </nav>
    </div>
  );
}
