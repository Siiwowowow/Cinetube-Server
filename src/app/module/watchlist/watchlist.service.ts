import AppError from '../../errorHelpers/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { ensureMediaExists } from '../media/media.service.js';

const addToWatchlist = async (userId: string, mediaId: string) => {
  const mediaExists = await ensureMediaExists(mediaId);
  if (!mediaExists) {
    throw new AppError(404, 'Media not found');
  }

  const existing = await prisma.watchlist.findUnique({
    where: {
      userId_mediaId: { userId, mediaId }
    }
  });
  
  if (existing) {
    throw new AppError(400, 'Media already in watchlist');
  }
  
  const watchlist = await prisma.watchlist.create({
    data: { userId, mediaId },
    include: { media: true }
  });
  
  return watchlist;
};

const removeFromWatchlist = async (userId: string, mediaId: string) => {
  const watchlist = await prisma.watchlist.delete({
    where: {
      userId_mediaId: { userId, mediaId }
    }
  });
  
  return watchlist;
};

const getWatchlist = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  
  const [watchlist, total] = await Promise.all([
    prisma.watchlist.findMany({
      where: { userId },
      include: {
        media: {
          include: {
            genres: { include: { genre: true } }
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

const isInWatchlist = async (userId: string, mediaId: string) => {
  const watchlist = await prisma.watchlist.findUnique({
    where: {
      userId_mediaId: { userId, mediaId }
    }
  });
  
  return { inWatchlist: !!watchlist };
};

export const WatchlistService = {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  isInWatchlist
};