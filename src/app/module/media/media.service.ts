/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errorHelpers/AppError.js";
import { IMedia, IMediaFilters } from "./media.interface.js";
import { prisma } from "../../lib/prisma.js";
import { getAdminIdByUserId } from "../../utils/admin.js";
export const ensureMediaExists = async (mediaId: string) => {
  const media = await prisma.media.findUnique({
    where: { id: mediaId }
  });
  
  return media;
};
const createMedia = async (data: IMedia, adminId: string) => {
  const { genreIds, ...mediaData } = data;
  
  const media = await prisma.media.create({
    data: {
      ...mediaData,
      isPublished: true,
      genres: {
        create: genreIds.map(genreId => ({
          genre: { connect: { id: genreId } }
        }))
      }
    },
    include: {
      genres: {
        include: { genre: true }
      }
    }
  });
  
  const realAdminId = await getAdminIdByUserId(adminId);
  if (realAdminId) {
    await prisma.adminLog.create({
      data: {
        adminId: realAdminId,
        action: 'CREATE_MEDIA',
        targetType: 'media',
        targetId: media.id,
        details: { title: media.title }
      }
    });
  }
  
  return media;
};

const getAllMedia = async (filters: IMediaFilters) => {
  const { genre, year, rating, mediaType, streamingPlatform, search, page = 1, limit = 10, sort } = filters;
  
  const where: any = { isPublished: true };
  
  if (mediaType) where.mediaType = mediaType;
  if (year) where.releaseYear = Number(year);
  if (streamingPlatform) where.streamingPlatform = streamingPlatform;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { director: { contains: search, mode: 'insensitive' } },
      { cast: { hasSome: [search] } }
    ];
  }
  if (rating) where.averageRating = { gte: Number(rating) };
  if (genre) {
    where.genres = {
      some: { genre: { name: { equals: genre, mode: 'insensitive' } } }
    };
  }

  // Handle custom filter categories/sorts
  if (sort === "editors-picks") {
    where.averageRating = { ...where.averageRating, gte: 8.5 };
  }
  
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 10;
  const skip = (parsedPage - 1) * parsedLimit;

  let orderBy: any = { createdAt: 'desc' };
  if (sort === "top-rated") {
    orderBy = { averageRating: 'desc' };
  } else if (sort === "trending") {
    orderBy = { viewCount: 'desc' };
  } else if (sort === "newly-added" || sort === "new-releases" || sort === "latest") {
    orderBy = [
      { releaseYear: 'desc' },
      { createdAt: 'desc' }
    ];
  }
  
  const [media, total] = await Promise.all([
    prisma.media.findMany({
      where,
      include: {
        genres: { include: { genre: true } },
        reviews: {
          where: { status: 'APPROVED' },
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, email: true } } }
        }
      },
      skip,
      take: parsedLimit,
      orderBy: orderBy
    }),
    prisma.media.count({ where })
  ]);
  
  return {
    data: media,
    meta: { page: parsedPage, limit: parsedLimit, total, totalPages: Math.ceil(total / parsedLimit) }
  };
};

const getMediaById = async (id: string, userId?: string) => {
  // Lazily ensure mock media records exist on the fly when requested
  await ensureMediaExists(id);

  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      genres: { include: { genre: true } },
      reviews: {
        where: { status: 'APPROVED' },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          comments: {
            where: { parentId: null },
            include: {
              user: { select: { name: true, email: true, image: true } },
              likes: true,
              replies: {
                include: {
                  user: { select: { name: true, email: true, image: true } },
                  likes: true
                },
                orderBy: { createdAt: 'asc' }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          likes: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: { likes: true, comments: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  
  if (!media) throw new AppError(404, 'Media not found');
  
  // Increment view count
  await prisma.media.update({
    where: { id },
    data: { viewCount: { increment: 1 } }
  });
  
  // Check if in user's watchlist
  let inWatchlist = false;
  if (userId) {
    const watchlist = await prisma.watchlist.findUnique({
      where: {
        userId_mediaId: { userId, mediaId: id }
      }
    });
    inWatchlist = !!watchlist;
  }
  
  return { ...media, inWatchlist };
};

const updateMedia = async (id: string, data: Partial<IMedia>, adminId: string) => {
  const { genreIds, ...updateData } = data;
  
  const media = await prisma.media.update({
    where: { id },
    data: {
      ...updateData,
      ...(genreIds && {
        genres: {
          deleteMany: {},
          create: genreIds.map(genreId => ({
            genre: { connect: { id: genreId } }
          }))
        }
      })
    },
    include: { genres: { include: { genre: true } } }
  });
  
  const realAdminId = await getAdminIdByUserId(adminId);
  if (realAdminId) {
    await prisma.adminLog.create({
      data: {
        adminId: realAdminId,
        action: 'UPDATE_MEDIA',
        targetType: 'media',
        targetId: id,
        details: { title: media.title }
      }
    });
  }
  
  return media;
};

const deleteMedia = async (id: string, adminId: string) => {
  const media = await prisma.media.delete({ where: { id } });
  
  const realAdminId = await getAdminIdByUserId(adminId);
  if (realAdminId) {
    await prisma.adminLog.create({
      data: {
        adminId: realAdminId,
        action: 'DELETE_MEDIA',
        targetType: 'media',
        targetId: id,
        details: { title: media.title }
      }
    });
  }
  
  return media;
};

const getTopRatedMedia = async (limit: number = 10) => {
  return await prisma.media.findMany({
    where: { isPublished: true },
    orderBy: { averageRating: 'desc' },
    take: limit,
    include: {
      genres: { include: { genre: true } }
    }
  });
};

const getTrendingMedia = async (limit: number = 10) => {
  return await prisma.media.findMany({
    where: { isPublished: true },
    orderBy: { viewCount: 'desc' },
    take: limit,
    include: {
      genres: { include: { genre: true } }
    }
  });
};

const getNewlyAdded = async (limit: number = 10) => {
  return await prisma.media.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      genres: { include: { genre: true } }
    }
  });
};

const getEditorPicks = async (limit: number = 10) => {
  return await prisma.media.findMany({
    where: { isPublished: true, viewCount: { gt: 100 } },
    orderBy: { averageRating: 'desc' },
    take: limit,
    include: {
      genres: { include: { genre: true } }
    }
  });
};

export const MediaService = {
  createMedia,
  getAllMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
  getTopRatedMedia,
  getTrendingMedia,
  getNewlyAdded,
  getEditorPicks
};