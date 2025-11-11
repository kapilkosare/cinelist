export type ContentType = "Movie" | "Web Series" | "OTT" | "Documentary" | "Other";

export interface Movie {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  posterUrl: string;
  trailerUrl?: string;
  rating?: number;
  year?: number;
  genreIds: string[];
}

export interface Genre {
    id: string;
    name: string;
}

export interface UserMovie {
    id: string;
    userId: string;
    movieId: string;
    wantToWatch: boolean;
    watched: boolean;
    rating?: number;
    notes?: string;
    category?: string;
}

export interface User {
    id: string;
    email: string;
    role: 'USER' | 'SUPER_ADMIN';
}

export interface AppSettings {
    isSignupEnabled: boolean;
}
