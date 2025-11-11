
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Genre } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGenreNames(genreIds: string[], genres: Genre[]): string[] {
  if (!genreIds || !genres) return [];
  return genreIds.map(id => genres.find(g => g.id === id)?.name).filter(Boolean) as string[];
}

export function getYouTubeVideoId(url: string): string | null {
    if (!url) return null;
    let videoId = null;

    // Regex to cover various YouTube URL formats
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|)([\w-]{11})/,
        /(?:https?:\/\/)?youtu\.be\/([\w-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            videoId = match[1];
            break;
        }
    }
    
    return videoId;
}

export function getYouTubeThumbnailUrl(trailerUrl?: string): string {
    const placeholder = 'https://placehold.co/600x900?text=No+Poster';
    if (!trailerUrl) {
        return placeholder;
    }
    const videoId = getYouTubeVideoId(trailerUrl);
    if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    // If a URL is provided but it's not a valid YouTube URL, check if it's a valid image URL
    if (trailerUrl.match(/\.(jpeg|jpg|gif|png)$/) != null) {
      return trailerUrl;
    }
    return placeholder;
}
