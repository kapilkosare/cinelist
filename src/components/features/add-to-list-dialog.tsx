'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Genre, Movie, UserMovie } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface AddToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movie: Movie;
  userMovie: UserMovie | undefined;
}

export function AddToListDialog({
  open,
  onOpenChange,
  movie,
  userMovie,
}: AddToListDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);

  const genresQuery = useMemoFirebase(
    () => query(collection(firestore, 'genres'), orderBy('name', 'asc')),
    [firestore]
  );
  const { data: genres, isLoading: isLoadingGenres } = useCollection<Genre>(genresQuery);

  React.useEffect(() => {
    // When dialog opens, reset category selection to ensure "Select..." is shown
    if (open) {
      setSelectedCategory(userMovie?.category ?? '');
    }
  }, [userMovie, open]);


  const handleSave = () => {
    if (!user) return;
    if (!selectedCategory) {
      toast({
        title: 'No Category Selected',
        description: 'Please select a category for this movie.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    if (userMovie) { // Exists, so we are updating it
      const userMovieDocRef = doc(
        firestore,
        `users/${user.uid}/userMovies`,
        userMovie.id
      );
      setDocumentNonBlocking(
        userMovieDocRef,
        { wantToWatch: true, category: selectedCategory },
        { merge: true }
      );
    } else { // Doesn't exist, so we are creating it
      const userMoviesColRef = collection(
        firestore,
        `users/${user.uid}/userMovies`
      );
      const newUserMovie = {
        userId: user.uid,
        movieId: movie.id,
        wantToWatch: true,
        watched: false,
        category: selectedCategory,
      };
      addDocumentNonBlocking(userMoviesColRef, newUserMovie);
    }

    toast({
      title: 'Added to My List',
      description: `"${movie.title}" was added to the "${selectedCategory}" category.`,
    });

    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add "{movie.title}" to a list</DialogTitle>
          <DialogDescription>
            Select a category to organize your watchlist.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={isLoadingGenres}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={8} className="max-h-56">
                {isLoadingGenres ? (
                    <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                ) : (
                    genres?.map((genre) => (
                        <SelectItem key={genre.id} value={genre.name}>
                        {genre.name}
                        </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isLoadingGenres || !selectedCategory}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save to List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
