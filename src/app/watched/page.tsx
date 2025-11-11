
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDoc,
  doc,
} from 'firebase/firestore';
import type { Movie, UserMovie } from '@/lib/types';
import { MovieCard } from '@/components/features/movie-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrailerModal } from '@/components/features/trailer-modal';
import { BackButton } from '@/components/layout/back-button';
import { Grid, List, LayoutList } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MovieListItem } from '@/components/features/MovieListItem';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list' | 'details';

export default function WatchedPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('details');

  const userMoviesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/userMovies`),
      where('watched', '==', true)
    );
  }, [firestore, user]);

  const {
    data: userMovies,
    isLoading: isLoadingUserMovies,
    error: userMoviesError,
  } = useCollection<UserMovie>(userMoviesQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const fetchMoviesDetails = async () => {
      if (userMovies) {
        setIsLoadingMovies(true);
        try {
          const movieIds = userMovies.map((um) => um.movieId);
          if (movieIds.length === 0) {
            setMovies([]);
            setIsLoadingMovies(false);
            return;
          }
          const moviePromises = movieIds.map((id) =>
            getDoc(doc(firestore, 'movies', id))
          );
          const movieSnapshots = await Promise.all(moviePromises);
          const moviesData = movieSnapshots
            .map((snap) => {
                if (snap.exists()) {
                    return { ...snap.data(), id: snap.id } as Movie
                }
                return null;
            })
            .filter((m): m is Movie => m !== null);
          
          moviesData.sort((a,b) => a.title.localeCompare(b.title));
          setMovies(moviesData);

        } catch (error) {
          console.error('Error fetching movie details:', error);
        } finally {
          setIsLoadingMovies(false);
        }
      }
    };

    if (!isLoadingUserMovies) {
        fetchMoviesDetails();
    }
  }, [userMovies, firestore, isLoadingUserMovies]);

  const isLoading = isUserLoading || isLoadingUserMovies || isLoadingMovies;
  
  const handlePlayTrailer = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  if (!user && !isUserLoading) {
      return null;
  }
  
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
                <h1 className="text-3xl font-bold font-headline">Watched Movies</h1>
                <p className="text-muted-foreground mt-2">
                    Movies you've already seen.
                </p>
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
            : movies.map((movie) => (
                viewMode === 'grid' ? (
                    <MovieCard key={movie.id} movie={movie} onPlayTrailer={handlePlayTrailer} />
                ) : (
                    <MovieListItem key={movie.id} movie={movie} onPlayTrailer={handlePlayTrailer} view={viewMode} />
                )
            ))}
        </div>

      {!isLoading && movies.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg mt-8">
           <h2 className="text-xl font-semibold">You haven't marked any movies as watched.</h2>
           <p className="text-muted-foreground mt-2">
              Mark a movie as watched to add it here.
           </p>
           <Button asChild className="mt-4">
               <Link href="/">Browse Movies</Link>
           </Button>
        </div>
      )}
      {userMoviesError && (
        <p className="text-destructive mt-4">
          Error loading your watched list: {userMoviesError.message}
        </p>
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
