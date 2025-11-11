'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { BackButton } from '@/components/layout/back-button';
import { MovieForm } from '@/components/features/movie-form';

export default function NewMoviePage() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <BackButton />
        <h1 className="text-3xl font-bold font-headline">Add New Content</h1>
        <p className="text-muted-foreground mt-1">Fill out the form to add a new item to the catalog.</p>
        <MovieForm />
      </div>
    </AppLayout>
  );
}
