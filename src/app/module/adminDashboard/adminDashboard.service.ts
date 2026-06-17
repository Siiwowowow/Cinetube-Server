//* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '../../lib/prisma.js';

const getDashboardStats = async () => {
  const [
    totalUsers,
    totalMedia,
    totalReviews,
    pendingReviews,
    totalPurchases,
    totalSubscriptions,
,
    recentUsers,
    topRatedMedia,
    totalRevenue
  ] = await Promise.all([
    prisma.user.count(),
    prisma.media.count({ where: { isPublished: true } }),
    prisma.review.count(),
    prisma.review.count({ where: { status: 'PENDING' } }),
    prisma.purchase.count({ where: { status: 'COMPLETED' } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.review.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { name: true, email: true } },
        media: { select: { title: true, posterUrl: true } }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, image: true }
    }),
    prisma.media.findMany({
      where: { isPublished: true },
      orderBy: { averageRating: 'desc' },
      take: 5,
      select: { id: true, title: true, averageRating: true, viewCount: true, posterUrl: true }
    }),
    prisma.purchase.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    })
  ]);
  
  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' }
  });
  
  const monthlySubscriptionRevenue = activeSubscriptions.length * 9.99;
  
  return {
    overview: {
      totalUsers,
      totalMedia,
      totalReviews,
      pendingReviews,
      totalPurchases,
      totalSubscriptions,
      totalRevenue: (totalRevenue._sum.amount || 0) + monthlySubscriptionRevenue
    },
    recentActivity: {
      pendingReviews,
      recentUsers: recentUsers.slice(0, 5)
    },
    topRatedMedia,
    revenue: {
      oneTimePurchases: totalRevenue._sum.amount || 0,
      subscriptionRevenue: monthlySubscriptionRevenue
    }
  };
};

const getPendingReviews = async (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        media: { select: { id: true, title: true, posterUrl: true } }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.review.count({ where: { status: 'PENDING' } })
  ]);
  
  return {
    data: reviews,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

const getUserActivityReport = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const userActivity = await prisma.user.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo }
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      image: true,
      role: true,
      _count: {
        select: {
          reviews: true,
          comments: true,
          purchases: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return userActivity;
};

const getContentReport = async () => {
  const mediaWithMostReviews = await prisma.media.findMany({
    where: { isPublished: true },
    include: {
      _count: {
        select: { reviews: { where: { status: 'APPROVED' } } }
      },
      genres: { include: { genre: true } }
    },
    orderBy: { reviews: { _count: 'desc' } },
    take: 10
  });
  
  const mostLikedReviews = await prisma.review.findMany({
    where: { status: 'APPROVED' },
    include: {
      user: { select: { name: true, email: true, image: true } },
      media: { select: { title: true, posterUrl: true } }
    },
    orderBy: { likesCount: 'desc' },
    take: 10
  });
  
  return {
    mostReviewedMedia: mediaWithMostReviews,
    mostLikedReviews
  };
};

export const AdminDashboardService = {
  getDashboardStats,
  getPendingReviews,
  getUserActivityReport,
  getContentReport
};