'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useUser, initiateEmailSignUp, initiateEmailSignIn } from '@/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  mode: 'login' | 'signup';
}

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  captcha: z.string().min(1, { message: 'Please solve the CAPTCHA.' }),
});

const signupSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(7, { message: 'Password must be at least 7 characters.' }),
  captcha: z.string().min(1, { message: 'Please solve the CAPTCHA.' }),
});

// Omit 'name' from FormData if it's not in loginSchema
type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type FormData = LoginFormData | SignupFormData;

export function AuthForm({ className, mode, ...props }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [captcha, setCaptcha] = React.useState({ num1: 0, num2: 0, answer: 0 });




  const schema = mode === 'login' ? loginSchema : signupSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1, num2, answer: num1 + num2 });
  };

  React.useEffect(() => {
    generateCaptcha();
  }, []);

  React.useEffect(() => {
    // If the user object is available and we're not still on the initial load,
    // it means the user has successfully logged in.
    if (user && !isUserLoading) {
      router.push('/');
    }
    // We don't want this effect to re-run on router changes, only when the user state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isUserLoading]);


  async function onSubmit(data: FormData) {
    setIsLoading(true);

    if (parseInt((data as any).captcha, 10) !== captcha.answer) {
      toast({
        title: 'CAPTCHA Failed',
        description:
          'The answer to the simple math problem was incorrect. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
      generateCaptcha();
      reset({ ...data, captcha: '' });
      return;
    }

    try {
      if (mode === 'signup') {
        const signupData = data as SignupFormData;
        await initiateEmailSignUp(auth, signupData.email, signupData.password);
        toast({
          title: 'Signup Successful',
          description: "You're now being logged in.",
        });
        // The onAuthStateChanged listener will handle the redirect.
      } else {
        const loginData = data as LoginFormData;
        await initiateEmailSignIn(auth, loginData.email, loginData.password);
        toast({
          title: 'Login Successful',
          description: "You're now being logged in.",
        });
      }
    } catch (error: any) {
      let description = 'An unexpected error occurred.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'An account with this email already exists. Please sign in instead.';
      } else if (error.code === 'auth/invalid-credential') {
        description = 'Invalid email or password. Please try again.';
      } else if (error.message) {
        description = error.message;
      }
      
      toast({
        title: `Error during ${mode}`,
        description,
        variant: 'destructive',
      });
      generateCaptcha();
      reset({ ...data, captcha: '' });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register('email')}
            />
            {errors?.email && (
              <p className="px-1 text-xs text-destructive">
                {errors.email.message as string}
              </p>
            )}
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="password">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                autoCapitalize="none"
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                autoCorrect="off"
                disabled={isLoading}
                {...register('password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
                <span className="sr-only">
                  {showPassword ? 'Hide password' : 'Show password'}
                </span>
              </Button>
            </div>
            {errors?.password && (
              <p className="px-1 text-xs text-destructive">
                {(errors.password as any).message as string}
              </p>
            )}
          </div>

          {mode === 'login' && (
            <div className="text-right text-sm">
              <Link
                href="/forgot-password"
                tabIndex={-1}
                className="font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <div className="grid gap-2">
            <Label
              htmlFor="captcha"
              className="text-sm flex items-center justify-center"
            >
              Solve: {captcha.num1} + {captcha.num2} = ?
            </Label>
            <Input
              id="captcha"
              placeholder="Your Answer"
              type="number"
              autoComplete="off"
              disabled={isLoading}
              {...register('captcha')}
            />
            {(errors as any)?.captcha && (
              <p className="px-1 text-xs text-destructive">
                {(errors as any).captcha.message as string}
              </p>
            )}
          </div>

          <Button disabled={isLoading || isUserLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </div>
      </form>
    </div>
  );
}
