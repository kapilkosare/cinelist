'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Film, Users, Tag } from 'lucide-react';


export default function AdminDashboardPage() {
  const { user, appUser, isUserLoading } = useUser();
  const router = useRouter();

  const isSuperAdmin = appUser?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isSuperAdmin) {
        router.push('/');
      }
    }
  }, [user, isUserLoading, router, isSuperAdmin]);

  if (isUserLoading || !user || !isSuperAdmin) {
    return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <AppLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
            <Link href="/admin/movies">
                <Card className="hover:bg-muted transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Content</CardTitle>
                        <Film className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Manage Catalog</div>
                        <p className="text-xs text-muted-foreground">Add, edit, and delete content.</p>
                    </CardContent>
                </Card>
            </Link>
            <Link href="/admin/users">
                 <Card className="hover:bg-muted transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Manage Users</div>
                        <p className="text-xs text-muted-foreground">View and manage user roles.</p>
                    </CardContent>
                </Card>
            </Link>
            <Link href="/admin/genres">
                 <Card className="hover:bg-muted transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Genres</CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Manage Genres</div>
                        <p className="text-xs text-muted-foreground">Add, edit, and delete genres.</p>
                    </CardContent>
                </Card>
            </Link>
        </div>
      </div>
    </AppLayout>
  );
}
