
'use client';

import * as React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import {
  useUser,
  useFirestore,
  useCollection,
  useDoc,
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Shield, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BackButton } from '@/components/layout/back-button';

interface AppSettings {
    isSignupEnabled: boolean;
}

const getInitials = (email?: string) => {
    return email?.charAt(0).toUpperCase() ?? 'U';
}

function SignupToggle() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const settingsDocRef = useMemoFirebase(() => doc(firestore, 'settings', 'app'), [firestore]);
    const { data: settings, isLoading } = useDoc<AppSettings>(settingsDocRef);
  
    const handleToggleSignup = (isEnabled: boolean) => {
      setDocumentNonBlocking(settingsDocRef, { isSignupEnabled: isEnabled }, { merge: true });
      toast({
        title: `Signups ${isEnabled ? 'Enabled' : 'Disabled'}`,
        description: `New user registrations are now ${isEnabled ? 'allowed' : 'disallowed'}.`,
      });
    };
  
    if (isLoading) {
      return <div className="flex items-center space-x-2"><Loader2 className="h-4 w-4 animate-spin" /><p>Loading setting...</p></div>;
    }
  
    return (
      <div className="flex items-center space-x-2">
        <Switch
          id="signup-toggle"
          checked={settings?.isSignupEnabled ?? false}
          onCheckedChange={handleToggleSignup}
        />
        <Label htmlFor="signup-toggle">Enable Public Signups</Label>
      </div>
    );
  }

export default function AdminUsersPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [userToDelete, setUserToDelete] = React.useState<AppUser | null>(null);

  // In a real app, you'd fetch the user's role from Firestore
  const isSuperAdmin = true; // Placeholder

  const usersQuery = useMemoFirebase(() => query(
    collection(firestore, 'users'),
    orderBy('email', 'asc')
  ), [firestore]);
  const { data: users, isLoading: isLoadingUsers, error: usersError } =
    useCollection<AppUser>(usersQuery);

  React.useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isSuperAdmin) {
        // You can also check for a specific role from Firestore here
        router.push('/'); // Redirect non-admins
      }
    }
  }, [user, isUserLoading, isSuperAdmin, router]);

  const handleRoleChange = (userId: string, newRole: 'USER' | 'SUPER_ADMIN') => {
    if (!userId) return;

    const userDocRef = doc(firestore, 'users', userId);
    setDocumentNonBlocking(userDocRef, { role: newRole }, { merge: true });
    toast({
      title: 'Role Updated',
      description: `The user role has been successfully changed to ${newRole}.`,
    });
  };
  
  const handleDeleteUser = () => {
    if (!userToDelete) return;
    
    // Admins can't delete other super admins for safety
    if (userToDelete.role === 'SUPER_ADMIN') {
        toast({
            title: 'Action Forbidden',
            description: 'Super administrators cannot be deleted.',
            variant: 'destructive',
        });
        setUserToDelete(null);
        return;
    }

    const userDocRef = doc(firestore, 'users', userToDelete.id);
    deleteDocumentNonBlocking(userDocRef);
    toast({
      title: 'User Data Deleted',
      description: `User ${userToDelete.email}'s data has been deleted. Their authentication account still exists until they are deleted from the Firebase console.`,
    });
    setUserToDelete(null); // Close the dialog
  };


  if (isUserLoading || !user || !isSuperAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading or unauthorized...</p>
      </div>
    );
  }

  return (
    <>
      <AppLayout>
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Users</h1>
            <p className="text-muted-foreground mt-1">
              Manage your application users and their roles.
            </p>
          </div>
        </div>
        
        <Card className="mt-6">
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield /> Signup Management</CardTitle>
              <CardDescription>
              Control whether new users can register for an account.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <SignupToggle />
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>
              A list of all registered users in your database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : usersError ? (
                   <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-destructive">
                          Error: Insufficient permissions to list users. Please check Firestore security rules.
                      </TableCell>
                  </TableRow>
                ) : users && users.length > 0 ? (
                  users.map((appUser) => (
                    <TableRow key={appUser.id}>
                      <TableCell>
                         <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                  <AvatarFallback>{getInitials(appUser.email)}</AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{appUser.email}</div>
                         </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={appUser.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                          {appUser.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                              disabled={appUser.id === user.uid}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Select 
                                  value={appUser.role}
                                  onValueChange={(newRole: 'USER' | 'SUPER_ADMIN') => handleRoleChange(appUser.id, newRole)}
                              >
                                  <SelectTrigger className="w-full border-0 focus:ring-0">
                                      <SelectValue placeholder="Change role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="USER">USER</SelectItem>
                                      <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                                  </SelectContent>
                              </Select>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem
                              onClick={() => setUserToDelete(appUser)}
                              className="text-destructive"
                            >
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AppLayout>
      
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete the user's data from this application. It cannot be undone. 
              The user's authentication account will still exist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
