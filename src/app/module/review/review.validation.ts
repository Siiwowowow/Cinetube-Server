import { z } from 'zod';

const createReview = z.object({
  body: z.object({
    rating: z.number().min(1).max(10),
    content: z.string().min(10, 'Review must be at least 10 characters'),
    tags: z.array(z.string()),
    isSpoiler: z.boolean().default(false),
    mediaId: z.string()
  })
});

const updateReview = createReview.partial();

const updateStatus = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED'])
  })
});

export const reviewValidation = { createReview, updateReview, updateStatus };