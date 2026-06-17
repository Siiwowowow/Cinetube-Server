import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { MediaService } from './media.service.js';
import { sendResponse } from '../../shared/sendResponse.js';


const createMedia = catchAsync(async (req: Request, res: Response) => {
  const result = await MediaService.createMedia(req.body, req.user!.userId);
  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: 'Media created successfully',
    data: result,
  });
});

const getAllMedia = catchAsync(async (req: Request, res: Response) => {
  const result = await MediaService.getAllMedia(req.query);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Media retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getMediaById = catchAsync(async (req: Request, res: Response) => {
  const result = await MediaService.getMediaById(req.params.id as string, req.user?.userId);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Media retrieved successfully',
    data: result,
  });
});

const updateMedia = catchAsync(async (req: Request, res: Response) => {
  const result = await MediaService.updateMedia(req.params.id as string, req.body, req.user!.userId);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Media updated successfully',
    data: result,
  });
});

const deleteMedia = catchAsync(async (req: Request, res: Response) => {
  const result = await MediaService.deleteMedia(req.params.id as string, req.user!.userId);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Media deleted successfully',
    data: result,
  });
});

const getTopRated = catchAsync(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const result = await MediaService.getTopRatedMedia(limit);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Top rated media retrieved successfully',
    data: result,
  });
});

const getTrending = catchAsync(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const result = await MediaService.getTrendingMedia(limit);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Trending media retrieved successfully',
    data: result,
  });
});

const getNewlyAdded = catchAsync(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const result = await MediaService.getNewlyAdded(limit);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Newly added media retrieved successfully',
    data: result,
  });
});

const getEditorPicks = catchAsync(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const result = await MediaService.getEditorPicks(limit);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Editor picks retrieved successfully',
    data: result,
  });
});

export const MediaController = {
  createMedia,
  getAllMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
  getTopRated,
  getTrending,
  getNewlyAdded,
  getEditorPicks
};