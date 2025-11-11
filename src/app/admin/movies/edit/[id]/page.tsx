'use client';

import * as React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { BackButton } from '@/components/layout/back-button';
import { MovieForm } from '@/components/features/movie-form';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Movie } from '@/lib/types';

interface EditMoviePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditMoviePage({ params }: EditMoviePageProps) {
  const { id } = React.use(params);
  const firestore = useFirestore();
  const movieRef = useMemoFirebase(() => doc(firestore, 'movies', id), [firestore, id]);
  const { data: movie, isLoading } = useDoc<Movie>(movieRef);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <BackButton />
        <h1 className="text-3xl font-bold font-headline">Edit Content</h1>
        <p className="text-muted-foreground mt-1">Update the content details below.</p>
        {isLoading ? (
          <p>Loading content...</p>
        ) : movie ? (
          <MovieForm movie={movie} />
        ) : (
          <p>Content not found.</p>
        )}
      </div>
    </AppLayout>
  );
}
