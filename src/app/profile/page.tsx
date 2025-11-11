'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  User,
} from 'firebase/auth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
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
import { BackButton } from '@/components/layout/back-button';

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .optional(),
  photoURL: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);


  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      photoURL: user?.photoURL ?? '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName ?? '',
        photoURL: user.photoURL ?? '',
      });
    }
  }, [user, form]);

  const getInitials = () => {
    if (user?.displayName) {
      const names = user.displayName.split(' ').filter(Boolean);
      if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return user.displayName.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() ?? 'U';
  };

  const handleUpdateProfile = async (data: ProfileFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateProfile(user as User, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
      // Force a re-render or state update if needed, though onAuthStateChanged should handle it
    } catch (error: any) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: 'Password Reset Email Sent',
        description: `A reset link has been sent to ${user.email}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Could not send password reset email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
        await deleteUser(user);
        toast({
            title: 'Account Deleted',
            description: 'Your account has been permanently deleted.',
        });
        // onAuthStateChanged will redirect to /login
    } catch (error: any) {
        toast({
            title: 'Error Deleting Account',
            description: error.message || 'An error occurred. You may need to sign in again to complete this action.',
            variant: 'destructive',
        });
        setIsDeleting(false);
    }
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
    <AppLayout>
      <BackButton />
      <h1 className="text-3xl font-bold font-headline">My Profile</h1>
      <p className="text-muted-foreground mt-2">
        Manage your account settings.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage
                  src={user.photoURL ?? ''}
                  alt={user.displayName ?? 'User Avatar'}
                />
                <AvatarFallback className="text-3xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold font-headline">
                {user.displayName || 'Cinephile'}
              </h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your display name and avatar URL.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(handleUpdateProfile)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    {...form.register('displayName')}
                    placeholder="Your Name"
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.displayName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.displayName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photoURL">Avatar URL</Label>
                  <Input
                    id="photoURL"
                    {...form.register('photoURL')}
                    placeholder="https://example.com/avatar.png"
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.photoURL && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.photoURL.message}
                    </p>
                  )}
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your account security settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Password</Label>
                <p className="text-sm text-muted-foreground">
                  To change your password, we&apos;ll send a secure link to your email address.
                </p>
              </div>
               <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handlePasswordReset}
                  disabled={isSendingReset}
                >
                  {isSendingReset && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Password Reset Email
                </Button>
            </CardContent>
          </Card>
          
          <Separator className="my-8" />

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                  <ShieldAlert /> Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                >
                  {isDeleting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Delete My Account
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account,
              your profile, and all of your watchlist data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Delete My Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
