
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Sparkles, Search, Youtube } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import {
  addDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Movie, Genre, ContentType } from '@/lib/types';
import { getGenreNames, getYouTubeThumbnailUrl } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { getMovieDetails } from '@/ai/flows/movie-details-flow';
import { findTrailer } from '@/ai/flows/find-trailer-flow';
import { AdvancedSearchDialog } from './advanced-search-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

const contentTypes: ContentType[] = ["Movie", "Web Series", "OTT", "Documentary", "Other"];
const contentTypesWithAny: (ContentType | 'Any')[] = ["Any", ...contentTypes];

const movieSchema = z.object({
  type: z.string().min(1, 'Content type is required').refine(val => val !== 'Any', {
    message: 'Please select a specific content type before saving.',
  }),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  posterUrl: z.string().optional(),
  trailerUrl: z.string().optional(),
  year: z.coerce.number().optional(),
  rating: z.coerce.number().min(0).max(10).optional(),
  genreIds: z.array(z.string()).default([]),
});

type MovieFormData = z.infer<typeof movieSchema>;

interface MovieFormProps {
  movie?: Movie;
}

export function MovieForm({ movie }: MovieFormProps) {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAutofilling, setIsAutofilling] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isFindingTrailer, setIsFindingTrailer] = React.useState(false);
  const [trailerPreview, setTrailerPreview] = React.useState<string | null>(null);

  const genresQuery = useMemoFirebase(() => query(
    collection(firestore, 'genres'),
    orderBy('name', 'asc')
  ), [firestore]);
  const { data: genres, isLoading: isLoadingGenres } =
    useCollection<Genre>(genresQuery);

  const form = useForm<MovieFormData>({
    resolver: zodResolver(movieSchema),
    defaultValues: movie
      ? {
          ...movie,
          type: movie.type || 'Movie',
          year: movie.year ?? undefined,
          rating: movie.rating ?? undefined,
          genreIds: movie.genreIds || [],
          trailerUrl: movie.trailerUrl || '',
        }
      : {
          type: 'Any',
          title: '',
          description: '',
          posterUrl: '',
          trailerUrl: '',
          year: undefined,
          rating: undefined,
          genreIds: [],
        },
  });

  const trailerUrlValue = form.watch('trailerUrl');
  React.useEffect(() => {
      if (movie && movie.trailerUrl) {
          setTrailerPreview(getYouTubeThumbnailUrl(movie.trailerUrl))
      }
  }, [movie]);


  React.useEffect(() => {
    if (trailerUrlValue) {
      setTrailerPreview(getYouTubeThumbnailUrl(trailerUrlValue));
    } else {
      setTrailerPreview(null);
    }
  }, [trailerUrlValue]);

  const fillFormWithMovieDetails = React.useCallback(async (movieTitle: string, type: ContentType | 'Any') => {
    setIsAutofilling(true);
    try {
        const searchType = type === 'Any' ? 'content' : type.toLowerCase();
      const details = await getMovieDetails({ title: movieTitle, type: searchType });
      if (details) {
        form.setValue('title', details.title, { shouldValidate: true });
        form.setValue('description', details.description, { shouldValidate: true });
        form.setValue('posterUrl', details.posterUrl, { shouldValidate: true });
        form.setValue('trailerUrl', details.trailerUrl, { shouldValidate: true });
        form.setValue('year', details.year, { shouldValidate: true });
        form.setValue('rating', details.rating, { shouldValidate: true });

        if (details.genreNames && genres) {
          const matchedGenreIds = details.genreNames.map(name => 
            genres.find(g => g.name.toLowerCase() === name.toLowerCase())?.id
          ).filter((id): id is string => !!id);
          form.setValue('genreIds', matchedGenreIds, { shouldValidate: true });
        }
        
        toast({
          title: 'Details Autofilled',
          description: `Successfully fetched details for "${details.title}".`,
        });
      }
    } catch (error) {
      console.error('Error autofilling movie details:', error);
      toast({
        title: 'Autofill Failed',
        description: 'Could not fetch movie details. Please try again or fill them in manually.',
        variant: 'destructive',
      });
    } finally {
      setIsAutofilling(false);
    }
  }, [form, genres, toast]);

  const handleAutofill = async () => {
    const title = form.getValues('title');
    const type = form.getValues('type') as ContentType | 'Any';
    if (!title) {
      toast({
        title: 'Title is missing',
        description: 'Please enter a movie title to autofill.',
        variant: 'destructive',
      });
      return;
    }
    await fillFormWithMovieDetails(title, type);
  };

  const handleFindTrailer = async () => {
    const title = form.getValues('title');
    if (!title) {
      toast({
        title: 'Title is missing',
        description: 'Please enter a movie title to find its trailer.',
        variant: 'destructive',
      });
      return;
    }
    setIsFindingTrailer(true);
    try {
      const result = await findTrailer({ title });
      if (result.trailerUrl) {
        form.setValue('trailerUrl', result.trailerUrl, { shouldValidate: true });
        toast({
          title: 'Trailer Found',
          description: 'Successfully found and filled the trailer URL.',
        });
      } else {
        toast({
          title: 'Trailer Not Found',
          description: 'Could not find a trailer for this movie.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error finding trailer:', error);
      toast({
        title: 'Trailer Search Failed',
        description: 'An error occurred while searching for the trailer.',
        variant: 'destructive',
      });
    } finally {
      setIsFindingTrailer(false);
    }
  };
  
  const handleAdvancedSearchSelect = async (selectedTitle: string) => {
    const type = form.getValues('type') as ContentType | 'Any';
    setIsSearching(false); // Close the dialog
    await fillFormWithMovieDetails(selectedTitle, type);
  };

  async function onSubmit(data: MovieFormData) {
    setIsLoading(true);
    try {
      // Create a clean copy of the data
      const movieData = { ...data };

      // Remove undefined fields before sending to Firestore
      Object.keys(movieData).forEach(key => {
        if (movieData[key as keyof MovieFormData] === undefined) {
          delete movieData[key as keyof MovieFormData];
        }
      });
      
      if (movie) {
        const movieDocRef = doc(firestore, 'movies', movie.id);
        setDocumentNonBlocking(movieDocRef, movieData, { merge: true });
        toast({
          title: 'Content Updated',
          description: `"${data.title}" has been successfully updated.`,
        });
      } else {
        const moviesColRef = collection(firestore, 'movies');
        await addDocumentNonBlocking(moviesColRef, movieData);
        toast({
          title: 'Content Added',
          description: `"${data.title}" has been successfully added.`,
        });
      }
      router.push('/admin/movies');
      router.refresh();
    } catch (error) {
      console.error('Error saving movie:', error);
      toast({
        title: 'Error',
        description: 'Could not save the content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const selectedGenreIds = form.watch('genreIds');
  const contentType = form.watch('type') as ContentType | 'Any';

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a content type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contentTypesWithAny.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="The Matrix" {...field} />
                    </FormControl>
                     <Button type="button" variant="outline" onClick={() => setIsSearching(true)} disabled={isAutofilling}>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                    <Button type="button" variant="outline" onClick={handleAutofill} disabled={isAutofilling}>
                      {isAutofilling ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Find with AI
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A computer hacker learns from mysterious rebels about the true nature of his reality..."
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="posterUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poster URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/poster.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="1999" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>IMDb Rating</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.1" placeholder="8.7" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
              control={form.control}
              name="trailerUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Trailer URL</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="https://www.youtube.com/watch?v=vKQi3bBA1y8" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={handleFindTrailer} disabled={isFindingTrailer}>
                      {isFindingTrailer ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Find AI
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open('https://www.youtube.com', '_blank')}
                    >
                      <Youtube className="mr-2 h-4 w-4" /> Open YouTube
                    </Button>
                  </div>
                  {trailerPreview && (
                    <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-1">Trailer Preview:</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={trailerPreview} alt="Trailer thumbnail" className="rounded-md border aspect-video object-cover w-48" />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormItem>
                 <FormLabel>Genres</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {isLoadingGenres ? (
                      <p>Loading genres...</p>
                    ) : selectedGenreIds.length > 0 ? (
                      getGenreNames(selectedGenreIds, genres ?? []).map(
                        (genreName) => (
                          <Badge key={genreName} variant="secondary">
                            {genreName}
                          </Badge>
                        )
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Genres will be populated by the AI autofill feature.
                      </p>
                    )}
                  </div>
                <FormDescription>
                    The AI can assign multiple genres. You can manually edit the genre IDs in the database if needed.
                </FormDescription>
            </FormItem>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading || isAutofilling || form.getValues('type') === 'Any'}>
              {(isLoading || isAutofilling) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {movie ? 'Update Content' : 'Save Content'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
    <AdvancedSearchDialog
        open={isSearching}
        onOpenChange={setIsSearching}
        onSelectMovie={handleAdvancedSearchSelect}
        contentType={contentType}
    />
    </>
  );
}
