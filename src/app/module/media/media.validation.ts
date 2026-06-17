import { z } from 'zod';

const createMedia = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    synopsis: z.string().optional(),
    posterUrl: z.string().url().optional(),
    backdropUrl: z.string().url().optional(),
    trailerUrl: z.string().url().optional(),
    releaseYear: z.number().int().min(1900).max(new Date().getFullYear()),
    director: z.string().optional(),
    cast: z.array(z.string()),
    duration: z.number().int().positive().optional(),
    language: z.string().default('English'),
    country: z.string().optional(),
    contentRating: z.string().optional(),
    mediaType: z.enum(['MOVIE', 'SERIES']),
    streamingLink: z.string().optional(),
    streamingPlatform: z.string().optional(),
    price: z.number().min(0),
    priceType: z.enum(['FREE', 'PREMIUM']),
    genreIds: z.array(z.string())
  })
});

const updateMedia = createMedia.partial();

export const mediaValidation = { createMedia, updateMedia };