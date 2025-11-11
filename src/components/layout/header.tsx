'use client';

import Link from 'next/link';
import { Film, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UserNav } from './user-nav';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname.startsWith('/admin');

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get('search') as string;
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };


  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-8 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Film className="h-6 w-6 text-primary" />
            <span className="inline-block font-headline text-2xl font-bold">
              Cinelist
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {!isAdmin && (
             <form className="relative hidden lg:block w-full max-w-sm" onSubmit={handleSearchSubmit}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input name="search" placeholder="Search movies..." className="pl-10" />
            </form>
          )}
          <nav className="flex items-center space-x-1">
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
