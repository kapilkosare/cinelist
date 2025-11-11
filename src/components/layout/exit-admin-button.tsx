'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function ExitAdminButton() {
  return (
    <Button variant="outline" asChild>
      <Link href="/">
        <LogOut className="mr-2 h-4 w-4" />
        Exit Admin
      </Link>
    </Button>
  );
}
