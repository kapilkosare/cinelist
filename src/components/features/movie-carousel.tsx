import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { Movie } from '@/lib/types';
import { MovieCard } from './movie-card';

interface MovieCarouselProps {
  title: string;
  movies: Movie[];
  onPlayTrailer: (movie: Movie) => void;
}

export function MovieCarousel({ title, movies, onPlayTrailer }: MovieCarouselProps) {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-headline font-bold mb-4">{title}</h2>
      <Carousel
        opts={{
          align: 'start',
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {movies.map((movie) => (
            <CarouselItem key={movie.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 pl-4">
              <MovieCard movie={movie} onPlayTrailer={onPlayTrailer} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
}
