/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReviewStatus } from '@prisma/client';
import { IReview, IReviewFilters } from './review.interface.js';
import AppError from '../../errorHelpers/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { ensureMediaExists } from '../media/media.service.js';
import { getAdminIdByUserId } from '../../utils/admin.js';

const createReview = async (data: IReview, userId: string) => {
  const mediaExists = await ensureMediaExists(data.mediaId);
  if (!mediaExists) {
    throw new AppError(404, 'Media not found');
  }

  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      mediaId: data.mediaId,
      status: { not: 'REJECTED' }
    }
  });
  
  if (existingReview) {
    throw new AppError(400, 'You have already reviewed this media');
  }
  
  const review = await prisma.review.create({
    data: {
      ...data,
      userId,
      status: 'PENDING'
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      media: { select: { id: true, title: true, posterUrl: true } }
    }
  });
  
  return review;
};

const getAllReviews = async (filters: IReviewFilters) => {
  const { mediaId, userId, status, page = 1, limit = 10 } = filters;
  
  const where: any = {};
  if (mediaId) where.mediaId = mediaId;
  if (userId) where.userId = userId;
  if (status) where.status = status;
  
  const skip = (page - 1) * limit;
  
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        media: { select: { id: true, title: true, posterUrl: true } },
        _count: { select: { likes: true, comments: true } }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.review.count({ where })
  ]);
  
  return {
    data: reviews,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

const getReviewById = async (id: string, userId?: string) => {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      media: true,
      likes: userId ? {
        where: { userId }
      } : false,
      comments: {
        where: { parentId: null },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          likes: userId ? {
            where: { userId }
          } : false,
          replies: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
              likes: userId ? {
                where: { userId }
              } : false
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      _count: { select: { likes: true, comments: true } }
    }
  });
  
  if (!review) throw new AppError(404, 'Review not found');
  
  return review;
};

const updateReview = async (id: string, data: Partial<IReview>, userId: string) => {
  const review = await prisma.review.findUnique({ where: { id } });
  
  if (!review) throw new AppError(404, 'Review not found');
  if (review.userId !== userId) throw new AppError(403, 'You can only update your own reviews');
  if (review.status !== 'PENDING') throw new AppError(400, 'Cannot update approved/rejected reviews');
  
  const updated = await prisma.review.update({
    where: { id },
    data,
    include: { user: { select: { name: true, email: true } } }
  });
  
  return updated;
};

const deleteReview = async (id: string, userId: string, isAdmin: boolean = false) => {
  const review = await prisma.review.findUnique({ where: { id } });
  
  if (!review) throw new AppError(404, 'Review not found');
  if (!isAdmin && review.userId !== userId) throw new AppError(403, 'Unauthorized');
  if (!isAdmin && review.status === 'APPROVED') throw new AppError(400, 'Cannot delete approved reviews');
  
  await prisma.review.delete({ where: { id } });
  
  await updateMediaAverageRating(review.mediaId);
  
  return { message: 'Review deleted successfully' };
};

const updateReviewStatus = async (id: string, status: ReviewStatus, adminId: string) => {
  const review = await prisma.review.update({
    where: { id },
    data: { status },
    include: { media: true }
  });
  
  if (status === 'APPROVED') {
    await updateMediaAverageRating(review.mediaId);
  }
  
  // Find correct Admin.id using user's ID passed in adminId
  const realAdminId = await getAdminIdByUserId(adminId);
  if (realAdminId) {
    await prisma.adminLog.create({
      data: {
        adminId: realAdminId,
        action: `REVIEW_${status}`,
        targetType: 'review',
        targetId: id,
        details: { mediaTitle: review.media.title }
      }
    });
  }
  
  return review;
};

const updateMediaAverageRating = async (mediaId: string) => {
  const approvedReviews = await prisma.review.aggregate({
    where: {
      mediaId,
      status: 'APPROVED'
    },
    _avg: { rating: true },
    _count: true
  });
  
  const averageRating = approvedReviews._avg.rating || 0;
  
  await prisma.media.update({
    where: { id: mediaId },
    data: { averageRating }
  });
};

const getUserReviewForMedia = async (userId: string, mediaId: string) => {
  const review = await prisma.review.findFirst({
    where: {
      userId,
      mediaId,
      status: { not: 'REJECTED' }
    }
  });
  
  return review;
};

export const ReviewService = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  updateReviewStatus,
  getUserReviewForMedia
};