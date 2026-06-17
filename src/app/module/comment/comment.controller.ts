import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { CommentService } from './comment.service.js';
import { sendResponse } from '../../shared/sendResponse.js';

const createComment = catchAsync(async (req: Request, res: Response) => {
  const result = await CommentService.createComment(req.body, req.user!.userId);
  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: 'Comment added successfully',
    data: result,
  });
});

const getCommentsByReview = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = req.query;
  const result = await CommentService.getCommentsByReview(
    req.params.reviewId as string,
    Number(page) || 1,
    Number(limit) || 20
  );
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Comments retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const updateComment = catchAsync(async (req: Request, res: Response) => {
  const result = await CommentService.updateComment(req.params.id as string, req.body.content, req.user!.userId);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Comment updated successfully',
    data: result,
  });
});

const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
  const result = await CommentService.deleteComment(req.params.id as string, req.user!.userId, isAdmin);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Comment deleted successfully',
    data: result,
  });
});

const toggleLikeReview = catchAsync(async (req: Request, res: Response) => {
  const result = await CommentService.toggleLikeReview(req.params.reviewId as string, req.user!.userId);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: result.liked ? 'Review liked' : 'Review unliked',
    data: result,
  });
});

const toggleLikeComment = catchAsync(async (req: Request, res: Response) => {
  const result = await CommentService.toggleLikeComment(req.params.commentId as string, req.user!.userId);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: result.liked ? 'Comment liked' : 'Comment unliked',
    data: result,
  });
});

export const CommentController = {
  createComment,
  getCommentsByReview,
  updateComment,
  deleteComment,
  toggleLikeReview,
  toggleLikeComment
};