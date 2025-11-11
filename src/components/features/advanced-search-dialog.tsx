
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { searchMovies } from '@/ai/flows/search-movies-flow';
import type { MovieSearchResult } from '@/ai/flows/search-movies';
import { useToast } from '@/hooks/use-toast';
import type { ContentType } from '@/lib/types';

interface AdvancedSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMovie: (title: string) => void;
  contentType: ContentType | 'Any';
}

export function AdvancedSearchDialog({
  open,
  onOpenChange,
  onSelectMovie,
  contentType,
}: AdvancedSearchDialogProps) {
  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<MovieSearchResult[]>([]);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsLoading(true);
    setResults([]);
    try {
      const searchType = contentType === 'Any' ? 'content' : contentType.toLowerCase();
      const response = await searchMovies({ query, type: searchType });
      setResults(response.results);
      if (response.results.length === 0) {
        toast({
          title: 'No Results',
          description: `No matching ${searchType} found for your query.`,
        });
      }
    } catch (error) {
      console.error('Error searching movies:', error);
      toast({
        title: 'Search Failed',
        description: 'Could not perform the search. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (title: string) => {
    onSelectMovie(title);
    // Reset state after selection
    setQuery('');
    setResults([]);
  };
  
  // Also reset state when dialog is closed manually
  React.useEffect(() => {
    if (!open) {
        setQuery('');
        setResults([]);
        setIsLoading(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Advanced Content Search</DialogTitle>
          <DialogDescription>
            Searching for <strong>{contentType === 'Any' ? 'All Content' : contentType}</strong>. Select an item to autofill the form.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSearch}>
          <div className="flex w-full items-center space-x-2">
            <Input
              id="search"
              placeholder="e.g., 'The Dark Knight'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
            <Button type="submit" disabled={isLoading || !query}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </div>
        </form>
        <div className="mt-4 max-h-60 overflow-y-auto">
          {results.length > 0 && (
            <ul className="space-y-2">
              {results.map((movie, index) => (
                <li key={`${movie.title}-${index}`}>
                  <button
                    onClick={() => handleSelect(movie.title)}
                    className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <p className="font-semibold">{movie.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {movie.year}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
