import { MediaType, PriceType } from '@prisma/client';

export interface IMedia {
  title: string;
  description: string;
  synopsis?: string;
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  releaseYear: number;
  director?: string;
  cast: string[];
  duration?: number;
  language?: string;
  country?: string;
  contentRating?: string;
  mediaType: MediaType;
  streamingLink?: string;
  streamingPlatform?: string;
  price: number;
  priceType: PriceType;
  genreIds: string[];
}

export interface IMediaFilters {
  genre?: string;
  year?: number;
  rating?: number;
  mediaType?: MediaType;
  streamingPlatform?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}