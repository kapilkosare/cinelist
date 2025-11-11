'use client';

import Link from 'next/link';
import { Film, ShieldX, Loader2 } from 'lucide-react';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AuthForm } from '@/components/auth/auth-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface AppSettings {
  isSignupEnabled: boolean;
}

function SignupContent() {
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(() => doc(firestore, 'settings', 'app'), [firestore]);
  const { data: settings, isLoading } = useDoc<AppSettings>(settingsDocRef);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }
  
  // Default to false if settings document doesn't exist
  const allowSignup = settings?.isSignupEnabled ?? false;

  if (allowSignup) {
    return <AuthForm mode="signup" />;
  }

  return (
    <Alert variant="destructive">
      <ShieldX className="h-4 w-4" />
      <AlertTitle>Signups Disabled</AlertTitle>
      <AlertDescription>
        We are not accepting new signups at this time. Please check back later.
      </AlertDescription>
    </Alert>
  );
}


export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center space-x-2">
                <Film className="h-8 w-8 text-primary" />
                <span className="inline-block font-headline text-3xl font-bold">
                Cinelist
                </span>
            </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
            <CardDescription>Join Cinelist to curate your movie world</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupContent />
          </CardContent>
          <CardFooter className="flex justify-center text-sm">
            <p>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
