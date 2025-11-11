
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import type { Movie } from '@/lib/types';
import { MovieCard } from '@/components/features/movie-card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrailerModal } from '@/components/features/trailer-modal';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/layout/back-button';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const q = searchParams.get('q');

  const moviesQuery = useMemoFirebase(() => query(collection(firestore, 'movies')), [firestore]);
  const { data: allMovies, isLoading: isLoadingAllMovies } = useCollection<Movie>(moviesQuery);

  useEffect(() => {
    if (isLoadingAllMovies) {
      setIsLoading(true);
      return;
    }

    if (!q) {
      setFilteredMovies([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    if (allMovies) {
      const lowercasedQuery = q.toLowerCase();
      const results = allMovies.filter(movie => 
        movie.title.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredMovies(results);
    }
    setIsLoading(false);

  }, [q, allMovies, isLoadingAllMovies]);

  const handlePlayTrailer = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  return (
    <AppLayout>
      <BackButton />
      {q ? (
        <>
          <h1 className="text-3xl font-bold font-headline">
            Search Results for &quot;{q}&quot;
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLoading ? 'Searching for movies...' : `${filteredMovies.length} results found.`}
          </p>
        </>
      ) : (
        <h1 className="text-3xl font-bold font-headline">Search for a movie</h1>
      )}

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video rounded-lg" />
                <Skeleton className="h-5 w-4/5 rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))
          : filteredMovies.map((movie) => <MovieCard key={movie.id} movie={movie} onPlayTrailer={handlePlayTrailer} />)}
      </div>
      {!isLoading && filteredMovies.length === 0 && q && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg mt-8">
          <h2 className="text-xl font-semibold">No movies found for &quot;{q}&quot;</h2>
          <p className="text-muted-foreground mt-2">
            Try searching for something else.
          </p>
          <Button asChild className="mt-4">
            <Link href="/">Browse All Movies</Link>
          </Button>
        </div>
      )}
      {selectedMovie && (
        <TrailerModal
          movie={selectedMovie}
          open={!!selectedMovie}
          onClose={handleCloseModal}
        />
      )}
    </AppLayout>
  );
}


export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
            <SearchPageContent />
        </Suspense>
    )
}
