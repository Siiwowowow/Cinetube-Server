import { ReviewStatus } from '@prisma/client';

export interface IReview {
  rating: number;
  content: string;
  tags: string[];
  isSpoiler: boolean;
  mediaId: string;
}

export interface IReviewFilters {
  mediaId?: string;
  userId?: string;
  status?: ReviewStatus;
  page?: number;
  limit?: number;
}