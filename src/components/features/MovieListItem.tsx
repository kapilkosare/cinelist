
'use client';

import Image from 'next/image';
import * as React from 'react';
import { Star, PlayCircle, ListPlus, ListChecks, Tv, Tv2, Loader2, Image as ImageIcon } from 'lucide-react';
import type { Movie, UserMovie } from '@/lib/types';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { MovieCard } from './movie-card';


interface MovieListItemProps {
  movie: Movie;
  onPlayTrailer: (movie: Movie) => void;
  className?: string;
  view: 'grid' | 'list' | 'details';
}

export function MovieListItem({ movie, onPlayTrailer, className, view }: MovieListItemProps) {
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

    if (wantToWatch && userMovie) {
      const userMovieDocRef = doc(firestore, `users/${user.uid}/userMovies`, userMovie.id);
      if(userMovie.watched) {
        setDocumentNonBlocking(userMovieDocRef, { wantToWatch: false }, { merge: true });
      } else {
        deleteDocumentNonBlocking(userMovieDocRef);
      }
      toast({
        title: 'Removed from My List',
        description: `"${movie?.title}" has been removed from your list.`,
      });
    } else {
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
        if (userMovie) {
            const userMovieDocRef = doc(firestore, `users/${user.uid}/userMovies`, userMovie.id);
            setDocumentNonBlocking(userMovieDocRef, { watched: true }, { merge: true });
        } else {
            const userMoviesColRef = collection(firestore, `users/${user.uid}/userMovies`);
            const newUserMovie = {
                userId: user.uid,
                movieId: movie.id,
                wantToWatch: false,
                watched: true,
                category: 'Others',
            };
            addDocumentNonBlocking(userMoviesColRef, newUserMovie);
        }
        toast({
            title: 'Marked as Watched',
            description: `"${movie?.title}" has been added to your watched list.`,
        });
    }
  };

  if (view === 'grid') {
    return <MovieCard movie={movie} onPlayTrailer={onPlayTrailer} className={className} />;
  }
  
  if (view === 'details') {
    return (
        <>
          <TooltipProvider>
            <div className={cn("flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50 border", className)}>
                <div className="relative flex-shrink-0 w-24 h-14 overflow-hidden rounded-md">
                    <Image
                        src={posterUrl}
                        alt={movie.title ?? 'Movie poster'}
                        fill
                        className="object-cover"
                        sizes="10vw"
                    />
                </div>
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-headline text-base font-semibold truncate">{movie.title}</h3>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                            {movie.year && <span className="border-l pl-2">{movie.year}</span>}
                            {movie.rating && (
                                <div className="flex items-center gap-1 border-l pl-2">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span className="font-bold text-foreground">
                                    {movie.rating.toFixed(1)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-0 ml-auto">
                           
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleToggleWantToWatch} disabled={isLoadingUserMovie}>
                                    {isLoadingUserMovie ? <Loader2 className="h-5 w-5 animate-spin" /> : wantToWatch ? <ListChecks className="h-5 w-5 text-primary" /> : <ListPlus className="h-5 w-5" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{wantToWatch ? 'Remove from My List' : 'Add to My List'}</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleToggleWatched} disabled={isLoadingUserMovie}>
                                    {isLoadingUserMovie ? <Loader2 className="h-5 w-5 animate-spin" /> : hasWatched ? <Tv2 className="h-5 w-5 text-primary" /> : <Tv className="h-5 w-5" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{hasWatched ? 'Remove from Watched' : 'Mark as Watched'}</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onPlayTrailer(movie)}>
                                        <PlayCircle className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Play Trailer</p></TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                    <p 
                        className="text-xs text-muted-foreground mt-1 overflow-hidden"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        {movie.description}
                    </p>
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

  return (
    <>
      <TooltipProvider>
        <div className={cn("flex gap-4 rounded-lg p-2 transition-colors hover:bg-muted/50", className)}>
            <div className={cn(
              "relative aspect-video flex-shrink-0 overflow-hidden rounded-md",
              "w-24 sm:w-32" // smaller thumbnail for list view
            )}>
                <Image
                    src={posterUrl}
                    alt={movie.title ?? 'Movie poster'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 30vw, (max-width: 1200px) 20vw, 15vw"
                />
            </div>
            <div className="flex flex-col justify-between flex-grow min-w-0">
                <div>
                    <h3 className="font-headline text-lg font-semibold truncate">{movie.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {movie.year && <span>{movie.year}</span>}
                        {movie.rating && (
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-bold text-foreground">
                                {movie.rating.toFixed(1)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center -ml-2 mt-2">
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

    

    