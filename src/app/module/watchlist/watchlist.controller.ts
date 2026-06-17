import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { WatchlistService } from './watchlist.service.js';
import { sendResponse } from '../../shared/sendResponse.js';

const addToWatchlist = catchAsync(async (req: Request, res: Response) => {
  const result = await WatchlistService.addToWatchlist(req.user!.userId, req.params.mediaId as string);
  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: 'Added to watchlist',
    data: result,
  });
});

const removeFromWatchlist = catchAsync(async (req: Request, res: Response) => {
  const result = await WatchlistService.removeFromWatchlist(req.user!.userId, req.params.mediaId as string);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Removed from watchlist',
    data: result,
  });
});

const getWatchlist = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = req.query;
  const result = await WatchlistService.getWatchlist(
    req.user!.userId,
    Number(page) || 1,
    Number(limit) || 10
  );
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Watchlist retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const isInWatchlist = catchAsync(async (req: Request, res: Response) => {
  const result = await WatchlistService.isInWatchlist(req.user!.userId, req.params.mediaId as string);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Watchlist status retrieved',
    data: result,
  });
});

export const WatchlistController = {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  isInWatchlist
};