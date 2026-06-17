import { Request, Response } from 'express';
import status from 'http-status';
import { ReviewStatus } from '@prisma/client';
import { catchAsync } from '../../shared/catchAsync.js';
import { ReviewService } from './review.service.js';
import { sendResponse } from '../../shared/sendResponse.js';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.createReview(req.body, req.user!.userId);
  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: 'Review submitted for approval',
    data: result,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getAllReviews(req.query);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Reviews retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getReviewById(req.params.id as string, req.user?.userId);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Review retrieved successfully',
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.updateReview(req.params.id as string, req.body, req.user!.userId);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Review updated successfully',
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
  const result = await ReviewService.deleteReview(req.params.id as string, req.user!.userId, isAdmin);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Review deleted successfully',
    data: result,
  });
});

const updateReviewStatus = catchAsync(async (req: Request, res: Response) => {
  const { status: reviewStatus } = req.body;
  const result = await ReviewService.updateReviewStatus(req.params.id as string, reviewStatus as ReviewStatus, req.user!.userId);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: `Review ${reviewStatus.toLowerCase()} successfully`,
    data: result,
  });
});

const getUserReviewForMedia = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getUserReviewForMedia(req.user!.userId, req.params.mediaId as string);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'User review retrieved',
    data: result,
  });
});

export const ReviewController = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  updateReviewStatus,
  getUserReviewForMedia
};