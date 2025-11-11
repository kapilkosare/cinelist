
'use client';

import * as React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Genre } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle, Trash, Edit } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@/components/ui/label';
import { BackButton } from '@/components/layout/back-button';
import { ExitAdminButton } from '@/components/layout/exit-admin-button';

const genreSchema = z.object({
  name: z.string().min(1, 'Genre name is required.'),
});

type GenreFormData = z.infer<typeof genreSchema>;

export default function AdminGenresPage() {
  const { user, appUser, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [genreToEdit, setGenreToEdit] = React.useState<Genre | null>(null);
  const [genreToDelete, setGenreToDelete] = React.useState<Genre | null>(null);
  
  const isSuperAdmin = appUser?.role === 'SUPER_ADMIN';

  const genresQuery = useMemoFirebase(
    () => query(collection(firestore, 'genres'), orderBy('name', 'asc')),
    [firestore]
  );
  const { data: genres, isLoading: isLoadingGenres } = useCollection<Genre>(genresQuery);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GenreFormData>({
    resolver: zodResolver(genreSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    setValue: setEditValue,
    formState: { errors: editErrors, isSubmitting: isSubmittingEdit },
} = useForm<GenreFormData>({
    resolver: zodResolver(genreSchema),
});


  React.useEffect(() => {
    if (!isUserLoading && (!user || !isSuperAdmin)) {
      router.push('/login');
    }
  }, [user, isUserLoading, isSuperAdmin, router]);
  
  React.useEffect(() => {
    if (genreToEdit) {
      setEditValue('name', genreToEdit.name);
    }
  }, [genreToEdit, setEditValue]);

  const handleAddGenre = async (data: GenreFormData) => {
    const genreDocRef = doc(collection(firestore, 'genres'));
    await addDocumentNonBlocking(genresCollectionRef, { name: data.name, id: genreDocRef.id });
    toast({
      title: 'Genre Added',
      description: `The genre "${data.name}" has been added.`,
    });
    reset();
  };

  const handleEditGenre = async (data: GenreFormData) => {
    if (!genreToEdit) return;
    const genreDocRef = doc(firestore, 'genres', genreToEdit.id);
    setDocumentNonBlocking(genreDocRef, { name: data.name }, { merge: true });
    toast({
      title: 'Genre Updated',
      description: `The genre has been renamed to "${data.name}".`,
    });
    setGenreToEdit(null);
  };
  
  const handleDeleteGenre = () => {
    if (!genreToDelete) return;
    const genreDocRef = doc(firestore, 'genres', genreToDelete.id);
    deleteDocumentNonBlocking(genreDocRef);
    toast({
        title: 'Genre Deleted',
        description: `The genre "${genreToDelete.name}" has been deleted.`,
    });
    setGenreToDelete(null);
  };
  
  const genresCollectionRef = useMemoFirebase(() => collection(firestore, 'genres'), [firestore]);

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
        <div className="pb-16">
        <div className="flex justify-between items-center mb-4">
          <BackButton />
          <ExitAdminButton />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Genres</h1>
            <p className="text-muted-foreground mt-1">Manage movie genres for categorization.</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mt-8">
          <div className="md:col-span-1">
            <form onSubmit={handleSubmit(handleAddGenre)}>
              <Card>
                <CardHeader>
                  <CardTitle>Add New Genre</CardTitle>
                  <CardDescription>Create a new genre for your movie catalog.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    id="name"
                    placeholder="e.g., Action"
                    {...register('name')}
                    disabled={isSubmitting}
                  />
                  {errors.name && <p className="mt-2 text-xs text-destructive">{errors.name.message}</p>}
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Genre
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Genre List</CardTitle>
                <CardDescription>A list of all available genres.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingGenres ? (
                      <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">Loading...</TableCell>
                      </TableRow>
                    ) : genres && genres.length > 0 ? (
                      genres.map((genre) => (
                        <TableRow key={genre.id}>
                          <TableCell className="font-medium">{genre.name}</TableCell>
                          <TableCell className="text-right">
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
                            <DropdownMenuItem onSelect={() => setGenreToEdit(genre)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setGenreToDelete(genre)} className="text-destructive">
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">No genres found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </AppLayout>

      {/* Edit Dialog */}
      <AlertDialog open={!!genreToEdit} onOpenChange={(open) => !open && setGenreToEdit(null)}>
        <AlertDialogContent>
            <form onSubmit={handleSubmitEdit(handleEditGenre)}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Edit Genre</AlertDialogTitle>
                    <AlertDialogDescription>
                    Rename the genre. This will update it across the entire application.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="edit-genre-name" className="sr-only">Genre Name</Label>
                    <Input
                        id="edit-genre-name"
                        {...registerEdit('name')}
                        disabled={isSubmittingEdit}
                    />
                     {editErrors.name && <p className="mt-2 text-xs text-destructive">{editErrors.name.message}</p>}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction type="submit" disabled={isSubmittingEdit}>Save Changes</AlertDialogAction>
                </AlertDialogFooter>
            </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!genreToDelete} onOpenChange={(open) => !open && setGenreToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the genre "{genreToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGenre}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
