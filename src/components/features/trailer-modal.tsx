'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import type { Movie, Genre } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { getGenreNames } from '@/lib/utils';
import { collection } from 'firebase/firestore';

interface TrailerModalProps {
  movie: Movie;
  open: boolean;
  onClose: () => void;
}

export function TrailerModal({ movie, open, onClose }: TrailerModalProps) {
  const firestore = useFirestore();
  const genresQuery = useMemoFirebase(() => collection(firestore, 'genres'), [firestore]);
  const { data: genres } = useCollection<Genre>(genresQuery);

  const trailerUrl = movie.trailerUrl?.replace('watch?v=', 'embed/');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0">
        {trailerUrl && (
          <div className="aspect-video">
            <iframe
              className="w-full h-full"
              src={trailerUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        )}
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-3xl font-headline">{movie.title}</DialogTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{movie.year}</span>
              {movie.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-foreground">
                    {movie.rating.toFixed(1)}
                  </span>
                  / 10
                </div>
              )}
            </div>
          </DialogHeader>
          <div className="mt-4 flex flex-wrap gap-2">
            {getGenreNames(movie.genreIds, genres ?? []).map((genreName) => (
              <Badge key={genreName} variant="secondary">
                {genreName}
              </Badge>
            ))}
          </div>
          <DialogDescription className="mt-4 text-base text-foreground/80">
            {movie.description}
          </DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  );
}
