'use client';

import Link from 'next/link';
import { Film, Mail, Loader2 } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const schema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setIsSent(true);
      toast({
        title: 'Check your email',
        description: `A password reset link has been sent to ${data.email}.`,
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: 'Error sending email',
        description: error.message || 'Could not send password reset email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

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
            <CardTitle className="font-headline text-2xl">Forgot Password</CardTitle>
            <CardDescription>
              {isSent 
                ? "Check your inbox for the reset link."
                : "Enter your email and we'll send you a link to reset your password."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSent ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                        className="pl-10"
                        disabled={isLoading}
                        {...register('email')}
                      />
                    </div>
                     {errors.email && <p className="px-1 text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>
                </div>
              </form>
            ) : (
                <div className="text-center text-sm text-muted-foreground">
                    <p>If you don&apos;t see the email, please check your spam folder.</p>
                </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center text-sm">
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Back to Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
