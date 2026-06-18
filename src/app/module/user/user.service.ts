import { deleteFileFromCloudinary } from "../../config/cloudinary.config.js";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import { prisma } from "../../lib/prisma.js";
import { IUpdateUserProfilePayload, IUserStats } from "./user.interface.js";
import AppError from "../../errorHelpers/AppError.js"; // Add this import

const updateMyProfile = async (
  user: IRequestUser,
  payload: IUpdateUserProfilePayload
) => {
  // Get existing user
  const existingUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.userId },
  });

  // Prepare update data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};

  // Add fields only if they are provided
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.email !== undefined) updateData.email = payload.email;

  // Handle image update
  if (payload.image) {
    // Delete old image from Cloudinary if it exists
    if (existingUser.image) {
      try {
        await deleteFileFromCloudinary(existingUser.image);
        console.log("Old profile photo deleted:", existingUser.image);
      } catch (error) {
        console.error("Failed to delete old image:", error);
        // Continue with update even if deletion fails
      }
    }
    updateData.image = payload.image;
  }

  // Update the user
  const updatedUser = await prisma.user.update({
    where: { id: existingUser.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// ✅ ADD THESE NEW METHODS

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      emailVerified: true,
      status: true,
      createdAt: true,
      stripeCustomerId: true,
      _count: {
        select: {
          reviews: { where: { status: 'APPROVED' } },
          comments: true,
          watchlist: true,
          purchases: { where: { status: 'COMPLETED' } }
        }
      }
    }
  });

  if (!user) throw new AppError(404, 'User not found');

  // Get recent reviews
  const recentReviews = await prisma.review.findMany({
    where: { userId, status: 'APPROVED' },
    include: {
      media: { select: { id: true, title: true, posterUrl: true, mediaType: true } },
      _count: { select: { likes: true, comments: true } }
    },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  // Get recent comments
  const recentComments = await prisma.comment.findMany({
    where: { userId },
    include: {
      review: {
        include: {
          media: { select: { id: true, title: true, posterUrl: true } }
        }
      },
      _count: { select: { likes: true } }
    },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  // Get active subscription
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gt: new Date() }
    }
  });

  // Get user stats
  const stats = await getUserStats(userId);

  return {
    ...user,
    stats,
    recentReviews,
    recentComments,
    activeSubscription
  };
};

const getUserStats = async (userId: string): Promise<IUserStats> => {
  const [reviews, likesReceived, averageRating] = await Promise.all([
    prisma.review.count({ where: { userId, status: 'APPROVED' } }),
    prisma.like.count({
      where: {
        review: { userId }
      }
    }),
    prisma.review.aggregate({
      where: { userId, status: 'APPROVED' },
      _avg: { rating: true }
    })
  ]);

  return {
    totalReviews: reviews,
    totalComments: await prisma.comment.count({ where: { userId } }),
    totalWatchlist: await prisma.watchlist.count({ where: { userId } }),
    totalPurchases: await prisma.purchase.count({ where: { userId, status: 'COMPLETED' } }),
    totalLikesReceived: likesReceived,
    averageRating: averageRating._avg.rating || 0
  };
};

const getUserWatchlist = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [watchlist, total] = await Promise.all([
    prisma.watchlist.findMany({
      where: { userId },
      include: {
        media: {
          include: {
            genres: { include: { genre: true } },
            reviews: {
              where: { status: 'APPROVED' },
              take: 3,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.watchlist.count({ where: { userId } })
  ]);

  return {
    data: watchlist,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

const getUserReviews = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      include: {
        media: { select: { id: true, title: true, posterUrl: true, mediaType: true } },
        _count: { select: { likes: true, comments: true } }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.review.count({ where: { userId } })
  ]);

  return {
    data: reviews,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

const getUserPurchases = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where: { userId, status: 'COMPLETED' },
      include: {
        media: {
          include: {
            genres: { include: { genre: true } }
          }
        }
      },
      skip,
      take: limit,
      orderBy: { purchasedAt: 'desc' }
    }),
    prisma.purchase.count({ where: { userId, status: 'COMPLETED' } })
  ]);

  return {
    data: purchases,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

const getUserActivity = async (userId: string, limit: number = 20) => {
  const [reviews, comments] = await Promise.all([
    prisma.review.findMany({
      where: { userId, status: 'APPROVED' },
      include: {
        media: { select: { title: true, posterUrl: true } }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.comment.findMany({
      where: { userId },
      include: {
        review: {
          include: {
            media: { select: { title: true } }
          }
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  // Combine and sort activities
  const activities = [
    ...reviews.map(r => ({ type: 'review', data: r, createdAt: r.createdAt })),
    ...comments.map(c => ({ type: 'comment', data: c, createdAt: c.createdAt }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return activities.slice(0, limit);
};

const getUserTransactions = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.transaction.count({ where: { userId } })
  ]);

  return {
    data: transactions,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

export const UserService = {
  updateMyProfile,
  getMyProfile,
  getUserStats,
  getUserWatchlist,
  getUserReviews,
  getUserPurchases,
  getUserActivity,
  getUserTransactions
};
