'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clapperboard, Tv, User, Shield, Film, Users, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/my-list', label: 'My List', icon: Clapperboard },
  { href: '/watched', label: 'Watched', icon: Tv },
  { href: '/profile', label: 'Profile', icon: User },
];

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/movies', label: 'Movies', icon: Film },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/genres', label: 'Genres', icon: Tag },
];

export function SidebarNav() {
  const pathname = usePathname();
  const isAdminPath = pathname.startsWith('/admin');
  
  // In a real app, this would be derived from the user's session
  const isSuperAdmin = true; 

  const navItems = isAdminPath ? adminNavItems : mainNavItems;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-background/80">
      <div className="flex items-center h-16 border-b px-6">
        <Link href="/" className="flex items-center gap-2">
           <Film className="h-6 w-6 text-primary" />
            <span className="font-headline text-2xl font-bold">
              Cinelist
            </span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start px-4 text-sm font-medium py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && item.href !== '/admin');
            const isAdminActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');
            
            const finalIsActive = isAdminPath ? isAdminActive : isActive;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                  finalIsActive && 'bg-muted text-primary'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {isSuperAdmin && (
        <div className="mt-auto p-4 border-t">
           <Link
                href={isAdminPath ? "/" : "/admin"}
                className='flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted'
              >
                <Shield className="h-4 w-4" />
                {isAdminPath ? "Exit Admin" : "Admin Panel"}
            </Link>
        </div>
      )}
    </aside>
  );
}
