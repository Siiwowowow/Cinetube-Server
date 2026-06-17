import { Request, Response } from "express";
import status from "http-status";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { UserService } from "./user.service.js";
import { prisma } from "../../lib/prisma.js";
import { deleteFileFromCloudinary } from "../../config/cloudinary.config.js";

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const payload = req.body;

  const result = await UserService.updateMyProfile(user, payload);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Profile updated successfully",
    data: result,
  });
});

const removeProfilePhoto = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const existingUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.userId },
  });

  if (existingUser.image) {
    try {
      await deleteFileFromCloudinary(existingUser.image);
    } catch (err) {
      console.log("Cloudinary delete failed:", err);
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.userId },
    data: { image: null },
  });

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Profile photo removed successfully",
    data: {
      image: updated.image,
    },
  });
});

// ✅ ADD THESE NEW METHODS

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await UserService.getMyProfile(user.userId);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Profile retrieved successfully",
    data: result,
  });
});

const getMyWatchlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await UserService.getUserWatchlist(user.userId, page, limit);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Watchlist retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await UserService.getUserReviews(user.userId, page, limit);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "My reviews retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getMyPurchases = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await UserService.getUserPurchases(user.userId, page, limit);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Purchase history retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getMyActivity = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await UserService.getUserActivity(user.userId, limit);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Recent activity retrieved successfully",
    data: result,
  });
});

const getMyStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await UserService.getUserStats(user.userId);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "User statistics retrieved successfully",
    data: result,
  });
});

export const UserController = {
  updateMyProfile,
  removeProfilePhoto,
  getMyProfile,      // ✅ New
  getMyWatchlist,    // ✅ New
  getMyReviews,      // ✅ New
  getMyPurchases,    // ✅ New
  getMyActivity,     // ✅ New
  getMyStats,        // ✅ New
};