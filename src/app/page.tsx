
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Movie, ContentType, Genre } from '@/lib/types';
import { MovieCard } from '@/components/features/movie-card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrailerModal } from '@/components/features/trailer-modal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, Grid, List, LayoutList } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MovieListItem } from '@/components/features/MovieListItem';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const contentTypes: ContentType[] = ["Movie", "Web Series", "OTT", "Documentary", "Other"];
const allTabs = ["All", ...contentTypes];
type ViewMode = 'grid' | 'list' | 'details';

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('title-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('details');

  const moviesQuery = useMemoFirebase(() => 
    query(
      collection(firestore, 'movies'),
      orderBy('title', 'asc')
    ), [firestore]);
    
  const {
    data: movies,
    isLoading: isLoadingMovies,
    error: moviesError,
  } = useCollection<Movie>(moviesQuery);

  const genresQuery = useMemoFirebase(
    () => query(collection(firestore, 'genres'), orderBy('name', 'asc')),
    [firestore]
  );
  const { data: genres, isLoading: isLoadingGenres } = useCollection<Genre>(genresQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const filteredMovies = useMemo(() => {
    let moviesToShow = movies ?? [];
    
    // 1. Filter by active tab (content type)
    if (activeTab !== 'All') {
      moviesToShow = moviesToShow.filter(movie => movie.type === activeTab);
    }
    
    // 2. Filter by Category (Genre)
    if (selectedCategory !== 'All' && genres) {
        const selectedGenre = genres.find(g => g.name === selectedCategory);
        if (selectedGenre) {
            moviesToShow = moviesToShow.filter(m => m.genreIds.includes(selectedGenre.id));
        }
    }

    // 3. Filter by Search Query
    if (searchQuery) {
        moviesToShow = moviesToShow.filter(m => 
            m.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    // 4. Sort
    moviesToShow.sort((a, b) => {
        switch (sortOrder) {
            case 'year-desc':
                return (b.year ?? 0) - (a.year ?? 0);
            case 'year-asc':
                return (a.year ?? 0) - (b.year ?? 0);
            case 'rating-desc':
                return (b.rating ?? 0) - (a.rating ?? 0);
            case 'rating-asc':
                return (a.rating ?? 0) - (b.rating ?? 0);
            case 'title-asc':
            default:
                return a.title.localeCompare(b.title);
        }
    });

    return moviesToShow;
  }, [movies, activeTab, searchQuery, selectedCategory, sortOrder, genres]);

  const handlePlayTrailer = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset filters when changing tabs for a cleaner experience
    setSearchQuery('');
    setSelectedCategory('All');
    setSortOrder('title-asc');
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  const isLoading = isLoadingMovies || isLoadingGenres;

  const filtersContent = (
    <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search this category..."
                className="pl-10"
                value={searchQuery}
                onChange={handleSearchChange}
                disabled={isLoading}
            />
        </div>
        <Select
            value={selectedCategory}
            onValueChange={handleCategoryChange}
            disabled={isLoading}
        >
            <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {genres?.map((genre) => (
                    <SelectItem key={genre.id} value={genre.name}>
                    {genre.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        <Select
            value={sortOrder}
            onValueChange={handleSortChange}
            disabled={isLoading}
        >
            <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="title-asc">Alphabetical</SelectItem>
                <SelectItem value="year-desc">Newest First</SelectItem>
                <SelectItem value="year-asc">Oldest First</SelectItem>
                <SelectItem value="rating-desc">Highest Rating</SelectItem>
                <SelectItem value="rating-asc">Lowest Rating</SelectItem>
            </SelectContent>
        </Select>
    </div>
  );

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
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold font-headline">
                    Browse Content
                </h1>
                <p className="text-muted-foreground mt-2">
                    Browse our collection of movies, series, and more.
                </p>
            </div>
            <div className="hidden md:block">
                {viewSwitcher}
            </div>
        </div>
          

          <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
            <div className="w-full overflow-x-auto">
              <TabsList className="inline-flex">
                {allTabs.map(tab => (
                  <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            <div className="mt-4">
                {/* Mobile Filters */}
                <div className="md:hidden">
                    <Accordion type="single" collapsible>
                        <AccordionItem value="filters" className="border-b-0">
                            <div className="flex items-center justify-between">
                                <AccordionTrigger className={cn(buttonVariants({ variant: 'outline' }), 'flex-1 justify-between pr-2')}>
                                    <div className='flex items-center'>
                                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                                        Filters & Sort
                                    </div>
                                </AccordionTrigger>
                                <div className="ml-2">
                                    {viewSwitcher}
                                </div>
                            </div>
                            <AccordionContent className="p-4 bg-muted/50 rounded-b-lg">
                                <div className="space-y-4">
                                    {filtersContent}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                {/* Desktop Filters */}
                <div className="hidden md:flex">
                    {filtersContent}
                </div>
            </div>
            
            <div className="mt-8">
                {isLoading && (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="space-y-3">
                                <Skeleton className="aspect-video rounded-lg" />
                                <Skeleton className="h-5 w-4/5 rounded-md" />
                                <Skeleton className="h-9 w-full rounded-md" />
                                </div>
                            ))}
                        </div>
                     ) : (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-28 w-full rounded-lg" />
                            ))}
                        </div>
                     )
                )}
                
                {!isLoading && filteredMovies && filteredMovies.length > 0 && (
                     viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                            {filteredMovies.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} onPlayTrailer={handlePlayTrailer} />
                            ))}
                        </div>
                     ) : (
                        <div className="space-y-4">
                            {filteredMovies.map((movie) => (
                                <MovieListItem key={movie.id} movie={movie} onPlayTrailer={handlePlayTrailer} view={viewMode} />
                            ))}
                        </div>
                     )
                )}

                {!isLoading && filteredMovies && filteredMovies.length === 0 && (
                    <p className="text-muted-foreground mt-8 text-center">
                      {searchQuery ? `No results for "${searchQuery}" in this category.` : "No content found for this category."}
                    </p>
                )}
                 {moviesError && (
                    <p className="text-destructive mt-4">
                    Error loading content. Please try again later.
                    </p>
                )}
            </div>

          </Tabs>

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
