
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { BackButton } from '@/components/layout/back-button';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  orderBy,
} from 'firebase/firestore';
import type { Movie, UserMovie, Genre, ContentType } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { TrailerModal } from '@/components/features/trailer-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { MovieCard } from '@/components/features/movie-card';
import { MovieListItem } from '@/components/features/MovieListItem';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, Grid, List, LayoutList } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const MOVIES_PER_PAGE = 15;
const contentTypes: ContentType[] = ["Movie", "Web Series", "OTT", "Documentary", "Other"];
const allTabs = ["All", ...contentTypes];
type ViewMode = 'grid' | 'list' | 'details';

export default function MyListPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const [moviesById, setMoviesById] = useState<Map<string, Movie>>(new Map());
  const [isLoadingMovies, setIsLoadingMovies] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('title-asc');
  const [activeTab, setActiveTab] = useState<string>("All");
  const [viewMode, setViewMode] = useState<ViewMode>('details');


  const userMoviesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/userMovies`));
  }, [firestore, user]);

  const {
    data: userMovies,
    isLoading: isLoadingUserMovies,
    error: userMoviesError,
  } = useCollection<UserMovie>(userMoviesQuery);
  
  const genresQuery = useMemoFirebase(
    () => query(collection(firestore, 'genres'), orderBy('name', 'asc')),
    [firestore]
  );
  const { data: genres, isLoading: isLoadingGenres } = useCollection<Genre>(genresQuery);

  const wantToWatchList = useMemo(() => {
    return userMovies?.filter(um => um.wantToWatch) ?? [];
  }, [userMovies]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const fetchMoviesDetails = async () => {
      if (wantToWatchList.length > 0) {
        setIsLoadingMovies(true);
        const newMoviesById = new Map(moviesById);
        const movieIdsToFetch = wantToWatchList
          .map((um) => um.movieId)
          .filter((id) => !newMoviesById.has(id));

        if (movieIdsToFetch.length > 0) {
          try {
            const moviePromises = movieIdsToFetch.map((id) =>
              getDoc(doc(firestore, 'movies', id))
            );
            const movieSnapshots = await Promise.all(moviePromises);
            movieSnapshots.forEach((snap) => {
              if (snap.exists()) {
                newMoviesById.set(snap.id, { ...snap.data(), id: snap.id } as Movie);
              }
            });
            setMoviesById(newMoviesById);
          } catch (error) {
            console.error('Error fetching movie details:', error);
          }
        }
        setIsLoadingMovies(false);
      } else if (wantToWatchList.length === 0 && !isLoadingUserMovies) {
        setIsLoadingMovies(false);
        setMoviesById(new Map());
      }
    };

    fetchMoviesDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantToWatchList, firestore, isLoadingUserMovies]);

  const filteredMovies = useMemo(() => {
    // Initial movie list creation from map
    let moviesToShow: Movie[] = wantToWatchList
        .map(um => moviesById.get(um.movieId))
        .filter((m): m is Movie => m !== undefined);
        
    // 0. Filter by active tab (content type)
    if (activeTab !== 'All') {
        moviesToShow = moviesToShow.filter(m => m.type === activeTab);
    }

    // 1. Filter by Category
    if (selectedCategory !== 'All') {
        const movieIdsInCategory = wantToWatchList
            .filter(um => um.category === selectedCategory)
            .map(um => um.movieId);
        moviesToShow = moviesToShow.filter(m => movieIdsInCategory.includes(m.id));
    }
    
    // 2. Filter by Search Query
    if (searchQuery) {
        moviesToShow = moviesToShow.filter(m => 
            m.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    // 3. Sort
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
  }, [wantToWatchList, moviesById, activeTab, selectedCategory, searchQuery, sortOrder]);


  const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE);

  const paginatedMovies = useMemo(() => {
    const startIndex = (currentPage - 1) * MOVIES_PER_PAGE;
    const endIndex = startIndex + MOVIES_PER_PAGE;
    return filteredMovies.slice(startIndex, endIndex);
  }, [filteredMovies, currentPage]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };
  
  const handleSortChange = (value: string) => {
    setSortOrder(value);
    setCurrentPage(1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

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
  
  const hasMoviesInList = wantToWatchList.length > 0;

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

  const filtersContent = (
    <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search your watchlist..."
                className="pl-10"
                value={searchQuery}
                onChange={handleSearchChange}
                disabled={!hasMoviesInList}
            />
        </div>
        <Select
            value={selectedCategory}
            onValueChange={handleCategoryChange}
            disabled={isLoadingGenres || !hasMoviesInList}
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
            disabled={!hasMoviesInList}
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

  return (
    <>
      <AppLayout>
        <div className="space-y-8 pb-16">
          <div>
            <BackButton />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Watchlist</h1>
                    <p className="text-muted-foreground mt-2">
                    Content you want to watch.
                    </p>
                </div>
                <div className="hidden md:block">
                    {viewSwitcher}
                </div>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange}>
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
                                    <div className="flex items-center">
                                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                                        Filters
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
          </Tabs>

          {isLoading ? (
            viewMode === 'grid' ? (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                    <Skeleton className="aspect-video rounded-lg" />
                    <Skeleton className="h-5 w-4/5 rounded-md" />
                    <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                ))}
                </div>
            ) : (
                <div className="mt-8 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                </div>
            )
          ) : paginatedMovies.length > 0 ? (
            <>
                <div className={cn("mt-8", viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10" : "space-y-4")}>
                    {paginatedMovies.map((movie) => (
                        <MovieListItem key={movie.id} movie={movie} onPlayTrailer={handlePlayTrailer} view={viewMode} />
                    ))}
                </div>

                {totalPages > 1 && (
                    <Pagination className="mt-8">
                        <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage((p) => Math.max(1, p - 1));
                            }}
                            aria-disabled={currentPage === 1}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                            />
                        </PaginationItem>
                        <PaginationItem className="hidden sm:flex items-center text-sm font-medium">
                            Page {currentPage} of {totalPages}
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage((p) => Math.min(totalPages, p + 1));
                            }}
                            aria-disabled={currentPage === totalPages}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                            />
                        </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
           </>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg mt-8">
              <h2 className="text-xl font-semibold">
                {searchQuery ? `No results for "${searchQuery}"` :
                 selectedCategory === 'All' ? 'Your watchlist is empty' : `No content in "${selectedCategory}"`
                }
              </h2>
              <p className="text-muted-foreground mt-2">
                {searchQuery ? 'Try a different search term or clear the search.' :
                 selectedCategory === 'All' ? 'Add content to your list to see them here.' : 'Try selecting another category or adding content.'
                }
              </p>
              <Button asChild className="mt-4">
                <Link href="/">Browse Content</Link>
              </Button>
            </div>
          )}
          
          {userMoviesError && (
            <p className="text-destructive mt-4">
              Error loading your list: {userMoviesError.message}
            </p>
          )}

        </div>
      </AppLayout>
      {selectedMovie && (
        <TrailerModal
          movie={selectedMovie}
          open={!!selectedMovie}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
