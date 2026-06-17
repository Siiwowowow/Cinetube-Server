import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { AdminDashboardService } from './adminDashboard.service.js';
import { sendResponse } from '../../shared/sendResponse.js';

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminDashboardService.getDashboardStats();
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Dashboard stats retrieved',
    data: result,
  });
});

const getPendingReviews = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = req.query;
  const result = await AdminDashboardService.getPendingReviews(
    Number(page) || 1,
    Number(limit) || 20
  );
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Pending reviews retrieved',
    data: result.data,
    meta: result.meta,
  });
});

const getUserActivityReport = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminDashboardService.getUserActivityReport();
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'User activity report retrieved',
    data: result,
  });
});

const getContentReport = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminDashboardService.getContentReport();
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Content report retrieved',
    data: result,
  });
});

export const AdminDashboardController = {
  getDashboardStats,
  getPendingReviews,
  getUserActivityReport,
  getContentReport
};