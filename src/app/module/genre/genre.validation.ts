import { z } from 'zod';

const createGenreSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Genre name must be at least 2 characters')
      .max(50, 'Genre name must be less than 50 characters')
      .regex(/^[a-zA-Z\s\-&]+$/, 'Genre name can only contain letters, spaces, hyphens, and ampersands'),
    description: z.string()
      .max(500, 'Description must be less than 500 characters')
      .optional()
  })
});

const updateGenreSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Genre name must be at least 2 characters')
      .max(50, 'Genre name must be less than 50 characters')
      .regex(/^[a-zA-Z\s\-&]+$/, 'Genre name can only contain letters, spaces, hyphens, and ampersands')
      .optional(),
    description: z.string()
      .max(500, 'Description must be less than 500 characters')
      .optional()
  })
});

const getGenreParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid genre ID format'),
    slug: z.string().optional()
  })
});

export const GenreValidation = {
  createGenreSchema,
  updateGenreSchema,
  getGenreParamsSchema
};