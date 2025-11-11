'use client';

import Image from 'next/image';
import * as React from 'react';
import { Star, PlayCircle, Plus, Check, Loader2, ListPlus, ListChecks, Tv, Tv2 } from 'lucide-react';
import type { Movie, UserMovie } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, getYouTubeThumbnailUrl } from '@/lib/utils';
import { Button } from '../ui/button';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { AddToListDialog } from './add-to-list-dialog';

interface MovieCardProps {
  movie: Movie;
  className?: string;
  onPlayTrailer: (movie: Movie) => void;
}

export function MovieCard({ movie, className, onPlayTrailer }: MovieCardProps) {
  const posterUrl = getYouTubeThumbnailUrl(movie.trailerUrl);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [showAddToList, setShowAddToList] = React.useState(false);

  const userMovieQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/userMovies`),
      where('movieId', '==', movie.id),
      limit(1)
    );
  }, [firestore, user, movie.id]);

  const { data: userMovieData, isLoading: isLoadingUserMovie } = useCollection<UserMovie>(userMovieQuery);

  const userMovie = userMovieData?.[0];
  const wantToWatch = !!userMovie?.wantToWatch;
  const hasWatched = !!userMovie?.watched;

  const handleToggleWantToWatch = () => {
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to add movies to your list.',
        variant: 'destructive',
      });
      return;
    }

    if (wantToWatch && userMovie) { // It's on the list, so we remove it
      const userMovieDocRef = doc(firestore, `users/${user.uid}/userMovies`, userMovie.id);
      // If it's also watched, just set wantToWatch to false. Otherwise delete doc.
      if(userMovie.watched) {
        setDocumentNonBlocking(userMovieDocRef, { wantToWatch: false }, { merge: true });
      } else {
        deleteDocumentNonBlocking(userMovieDocRef);
      }
      toast({
        title: 'Removed from My List',
        description: `"${movie?.title}" has been removed from your list.`,
      });
    } else { // Not on the list, so open the dialog to add it
      setShowAddToList(true);
    }
  };

  const handleToggleWatched = () => {
     if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to mark movies as watched.',
        variant: 'destructive',
      });
      return;
    }

    if (hasWatched && userMovie) {
      const userMovieDocRef = doc(firestore, `users/${user.uid}/userMovies`, userMovie.id);
      // If it's on the watchlist, keep the doc but set watched to false. Otherwise delete it.
       if(userMovie.wantToWatch) {
         setDocumentNonBlocking(userMovieDocRef, { watched: false }, { merge: true });
       } else {
         deleteDocumentNonBlocking(userMovieDocRef);
       }
      toast({
        title: 'Removed from Watched',
        description: `"${movie?.title}" has been removed from your watched list.`,
      });
    } else {
        if (userMovie) { // Exists but watched is false
            const userMovieDocRef = doc(firestore, `users/${user.uid}/userMovies`, userMovie.id);
            setDocumentNonBlocking(userMovieDocRef, { watched: true }, { merge: true });
        } else { // Doesn't exist
            const userMoviesColRef = collection(firestore, `users/${user.uid}/userMovies`);
            const newUserMovie = {
                userId: user.uid,
                movieId: movie.id,
                wantToWatch: false,
                watched: true,
                category: 'Others', // Default category when marked as watched directly
            };
            addDocumentNonBlocking(userMoviesColRef, newUserMovie);
        }
        toast({
            title: 'Marked as Watched',
            description: `"${movie?.title}" has been added to your watched list.`,
        });
    }
  };


  return (
    <>
      <TooltipProvider>
        <div className={cn("group", className)}>
          <Card className="overflow-hidden transition-all duration-300">
            <CardContent className="p-0">
              <div className="relative aspect-video">
                <Image
                  src={posterUrl}
                  alt={movie.title ?? 'Movie poster'}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                {movie.rating && (
                  <Badge
                    variant="default"
                    className="absolute top-2 right-2 bg-background/80 text-foreground backdrop-blur-sm"
                  >
                    <Star className="w-3 h-3 mr-1 text-yellow-400 fill-yellow-400" />
                    {movie.rating.toFixed(1)}
                  </Badge>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 text-white/80 hover:text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 group-hover:scale-110"
                    onClick={() => onPlayTrailer(movie)}
                >
                    <PlayCircle className="w-14 h-14" />
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="mt-3">
            <h3 className="font-headline text-lg font-semibold truncate group-hover:text-primary">
              {movie.title}
            </h3>
            <div className="flex items-center justify-between">
              {movie.year && <p className="text-sm text-muted-foreground">{movie.year}</p>}
              <div className="flex items-center gap-1">
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleWantToWatch} disabled={isLoadingUserMovie}>
                          {isLoadingUserMovie ? (
                              <Loader2 className="animate-spin" />
                          ) : wantToWatch ? (
                              <ListChecks className="text-primary" />
                          ) : (
                              <ListPlus />
                          )}
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>{wantToWatch ? 'Remove from My List' : 'Add to My List'}</p>
                      </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleWatched} disabled={isLoadingUserMovie}>
                          {isLoadingUserMovie ? (
                              <Loader2 className="animate-spin" />
                          ) : hasWatched ? (
                              <Tv2 className="text-primary" />
                          ) : (
                              <Tv />
                          )}
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>{hasWatched ? 'Remove from Watched' : 'Mark as Watched'}</p>
                      </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPlayTrailer(movie)}>
                              <PlayCircle />
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>Play Trailer</p>
                      </TooltipContent>
                  </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
      
      {showAddToList && (
        <AddToListDialog
          open={showAddToList}
          onOpenChange={setShowAddToList}
          movie={movie}
          userMovie={userMovie}
        />
      )}
    </>
  );
}
