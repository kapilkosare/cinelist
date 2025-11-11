'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import type { Movie, UserMovie } from '@/lib/types';
import { MovieCard } from '@/components/features/movie-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrailerModal } from '@/components/features/trailer-modal';
import { BackButton } from '@/components/layout/back-button';

export default function WatchedPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

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

  return (
    <AppLayout>
      <BackButton />
      <h1 className="text-3xl font-bold font-headline">Watched Movies</h1>
      <p className="text-muted-foreground mt-2">
        Movies you've already seen.
      </p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video rounded-lg" />
                <Skeleton className="h-5 w-4/5 rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))
          : movies.map((movie) => <MovieCard key={movie.id} movie={movie} onPlayTrailer={handlePlayTrailer} />)}
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
