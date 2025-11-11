import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Film } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-background">
      <div className="max-w-md">
        <Film className="h-24 w-24 text-primary mx-auto mb-6" />
        <h1 className="text-8xl font-headline font-bold text-primary">404</h1>
        <h2 className="mt-4 text-3xl font-headline font-semibold">Page Not Found</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Oops! The page you&apos;re looking for seems to have been lost in the cutting room.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
