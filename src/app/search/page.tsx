
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { collection, query } from 'firebase/firestore';
import type { Movie } from '@/lib/types';
import { MovieCard } from '@/components/features/movie-card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrailerModal } from '@/components/features/trailer-modal';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/layout/back-button';
import { Grid, List, LayoutList } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MovieListItem } from '@/components/features/MovieListItem';
import { cn } from '@/lib/utils';


type ViewMode = 'grid' | 'list' | 'details';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('details');

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

  const viewSwitcher = (
    <TooltipProvider>
      <div className="flex items-center gap-1 rounded-md bg-muted p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={viewMode === 'grid' ? 'outline' : 'ghost'} size="icon" className="h-8 w-8 bg-background" onClick={() => setViewMode('grid')}>
              <Grid className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Grid View</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={viewMode === 'list' ? 'outline' : 'ghost'} size="icon" className="h-8 w-8 bg-background" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>List View</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={viewMode === 'details' ? 'outline' : 'ghost'} size="icon" className="h-8 w-8 bg-background" onClick={() => setViewMode('details')}>
              <LayoutList className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Details View</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );

  return (
    <AppLayout>
      <div className="pb-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
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
          </div>
          {viewSwitcher}
        </div>
      

      <div className={cn("mt-8", viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10" : "space-y-4")}>
        {isLoading
          ? (
                viewMode === 'grid' ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="aspect-video rounded-lg" />
                            <Skeleton className="h-5 w-4/5 rounded-md" />
                            <Skeleton className="h-9 w-full rounded-md" />
                        </div>
                    ))
                ) : (
                    Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))
                )
            )
          : filteredMovies.map((movie) => (
             viewMode === 'grid' ? (
                <MovieCard key={movie.id} movie={movie} onPlayTrailer={handlePlayTrailer} />
              ) : (
                <MovieListItem key={movie.id} movie={movie} onPlayTrailer={handlePlayTrailer} view={viewMode} />
              )
          ))}
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
      </div>
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
