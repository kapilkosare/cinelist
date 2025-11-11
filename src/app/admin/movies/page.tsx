'use client';

import * as React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import type { Movie, Genre } from '@/lib/types';
import { getGenreNames, getYouTubeThumbnailUrl } from '@/lib/utils';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/layout/back-button';
import { ExitAdminButton } from '@/components/layout/exit-admin-button';

export default function AdminMoviesPage() {
  const { user, appUser, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [movieToDelete, setMovieToDelete] = React.useState<string | null>(null);

  const isSuperAdmin = appUser?.role === 'SUPER_ADMIN';

  const moviesQuery = useMemoFirebase(() => query(
    collection(firestore, 'movies'),
    orderBy('title', 'asc')
  ), [firestore]);
  const { data: movies, isLoading: isLoadingMovies } =
    useCollection<Movie>(moviesQuery);

  const genresQuery = useMemoFirebase(() => query(
    collection(firestore, 'genres'),
    orderBy('name', 'asc')
  ), [firestore]);
  const { data: genres, isLoading: isLoadingGenres } =
    useCollection<Genre>(genresQuery);

  React.useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isSuperAdmin) {
        router.push('/'); 
      }
    }
  }, [user, isUserLoading, isSuperAdmin, router]);

  const handleDeleteMovie = () => {
    if (!movieToDelete) return;

    const movieDocRef = doc(firestore, 'movies', movieToDelete);
    deleteDocumentNonBlocking(movieDocRef);
    toast({
      title: 'Content Deleted',
      description: 'The content has been successfully deleted.',
    });
    setMovieToDelete(null); // Close the dialog
  };

  if (isUserLoading || !user || !isSuperAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading or unauthorized...</p>
      </div>
    );
  }

  return (
    <>
      <AppLayout>
        <div className="flex justify-between items-center mb-4">
          <BackButton />
          <ExitAdminButton />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Content Catalog</h1>
            <p className="text-muted-foreground mt-1">
              Manage your movie, series, and documentary catalog.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/movies/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Add Content
            </Link>
          </Button>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Content List</CardTitle>
            <CardDescription>
              A list of all content in your database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Image</span>
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Genres</TableHead>
                  <TableHead className="hidden md:table-cell">Year</TableHead>
                  <TableHead className="hidden md:table-cell">Rating</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingMovies || isLoadingGenres ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : movies && movies.length > 0 ? (
                  movies.map((movie) => (
                    <TableRow key={movie.id}>
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          alt={movie.title}
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={getYouTubeThumbnailUrl(movie.trailerUrl)}
                          width="64"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{movie.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{movie.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getGenreNames(movie.genreIds, genres ?? []).map(
                            (genreName) => (
                              <Badge key={genreName} variant="secondary">
                                {genreName}
                              </Badge>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {movie.year}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {movie.rating?.toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/movies/edit/${movie.id}`}>
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setMovieToDelete(movie.id)}
                              className="text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No content found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AppLayout>

      <AlertDialog open={!!movieToDelete} onOpenChange={(open) => !open && setMovieToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              content from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMovie}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
