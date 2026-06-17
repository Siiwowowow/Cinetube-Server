/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from '../../errorHelpers/AppError.js';
import { ICreateGenre, IUpdateGenre } from './genre.interface.js';
import { prisma } from '../../lib/prisma.js';
import { getAdminIdByUserId } from '../../utils/admin.js';

// Generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// Get all genres
const getAllGenres = async () => {
  const genres = await prisma.genre.findMany({
    include: {
      _count: {
        select: {
          media: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
  
  return genres;
};

// Get genre by ID
const getGenreById = async (id: string) => {
  const genre = await prisma.genre.findUnique({
    where: { id },
    include: {
      media: {
        include: {
          media: {
            select: {
              id: true,
              title: true,
              posterUrl: true,
              releaseYear: true,
              mediaType: true,
              averageRating: true
            }
          }
        }
      },
      _count: {
        select: {
          media: true
        }
      }
    }
  });
  
  if (!genre) {
    throw new AppError(404, 'Genre not found');
  }
  
  return genre;
};

// Get genre by slug
const getGenreBySlug = async (slug: string) => {
  const genre = await prisma.genre.findUnique({
    where: { slug },
    include: {
      media: {
        include: {
          media: {
            select: {
              id: true,
              title: true,
              posterUrl: true,
              releaseYear: true,
              mediaType: true,
              averageRating: true,
              description: true
            }
          }
        },
        take: 20
      },
      _count: {
        select: {
          media: true
        }
      }
    }
  });
  
  if (!genre) {
    throw new AppError(404, 'Genre not found');
  }
  
  return genre;
};

// Create new genre (Admin only)
const createGenre = async (data: ICreateGenre, adminId?: string) => {
  // Check if genre already exists
  const existingGenre = await prisma.genre.findFirst({
    where: {
      OR: [
        { name: { equals: data.name, mode: 'insensitive' } },
        { slug: generateSlug(data.name) }
      ]
    }
  });
  
  if (existingGenre) {
    throw new AppError(400, 'Genre with this name already exists');
  }
  
  const slug = generateSlug(data.name);
  
  const genre = await prisma.genre.create({
    data: {
      name: data.name,
      description: data.description,
      slug
    }
  });
  
  // Log admin action if adminId provided
  if (adminId) {
    const realAdminId = await getAdminIdByUserId(adminId);
    if (realAdminId) {
      await prisma.adminLog.create({
        data: {
          adminId: realAdminId,
          action: 'CREATE_GENRE',
          targetType: 'genre',
          targetId: genre.id,
          details: { name: genre.name, slug: genre.slug }
        }
      });
    }
  }
  
  return genre;
};

// Update genre (Admin only)
const updateGenre = async (id: string, data: IUpdateGenre, adminId: string) => {
  const existingGenre = await prisma.genre.findUnique({
    where: { id }
  });
  
  if (!existingGenre) {
    throw new AppError(404, 'Genre not found');
  }
  
  // Check for duplicate name if name is being updated
  if (data.name && data.name !== existingGenre.name) {
    const duplicateGenre = await prisma.genre.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        id: { not: id }
      }
    });
    
    if (duplicateGenre) {
      throw new AppError(400, 'Genre with this name already exists');
    }
  }
  
  const updateData: any = {};
  if (data.name) {
    updateData.name = data.name;
    updateData.slug = generateSlug(data.name);
  }
  if (data.description !== undefined) updateData.description = data.description;
  
  const genre = await prisma.genre.update({
    where: { id },
    data: updateData
  });
  
  // Log admin action
  const realAdminId = await getAdminIdByUserId(adminId);
  if (realAdminId) {
    await prisma.adminLog.create({
      data: {
        adminId: realAdminId,
        action: 'UPDATE_GENRE',
        targetType: 'genre',
        targetId: id,
        details: { 
          oldName: existingGenre.name, 
          newName: data.name || existingGenre.name 
        }
      }
    });
  }
  
  return genre;
};

// Delete genre (Admin only)
const deleteGenre = async (id: string, adminId: string) => {
  const genre = await prisma.genre.findUnique({
    where: { id },
    include: {
      _count: {
        select: { media: true }
      }
    }
  });
  
  if (!genre) {
    throw new AppError(404, 'Genre not found');
  }
  
  // Check if genre has associated media
  if (genre._count.media > 0) {
    throw new AppError(400, `Cannot delete genre with ${genre._count.media} associated media items. Remove associations first.`);
  }
  
  await prisma.genre.delete({
    where: { id }
  });
  
  // Log admin action
  const realAdminId = await getAdminIdByUserId(adminId);
  if (realAdminId) {
    await prisma.adminLog.create({
      data: {
        adminId: realAdminId,
        action: 'DELETE_GENRE',
        targetType: 'genre',
        targetId: id,
        details: { name: genre.name }
      }
    });
  }
  
  return { message: 'Genre deleted successfully', genre };
};

// Get popular genres (with most media)
const getPopularGenres = async (limit: number = 10) => {
  const genres = await prisma.genre.findMany({
    include: {
      _count: {
        select: { media: true }
      }
    },
    orderBy: {
      media: {
        _count: 'desc'
      }
    },
    take: limit
  });
  
  return genres;
};

// Get genres with media count
const getGenresWithCount = async () => {
  const genres = await prisma.genre.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          media: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
  
  return genres;
};

// Bulk create genres (for seeding)
const bulkCreateGenres = async (genres: ICreateGenre[], adminId?: string) => {
  const results = [];
  
  for (const genre of genres) {
    try {
      const existingGenre = await prisma.genre.findFirst({
        where: {
          OR: [
            { name: { equals: genre.name, mode: 'insensitive' } },
            { slug: generateSlug(genre.name) }
          ]
        }
      });
      
      if (!existingGenre) {
        const newGenre = await prisma.genre.create({
          data: {
            name: genre.name,
            description: genre.description,
            slug: generateSlug(genre.name)
          }
        });
        results.push(newGenre);
        
        if (adminId) {
          const realAdminId = await getAdminIdByUserId(adminId);
          if (realAdminId) {
            await prisma.adminLog.create({
              data: {
                adminId: realAdminId,
                action: 'CREATE_GENRE',
                targetType: 'genre',
                targetId: newGenre.id,
                details: { name: newGenre.name }
              }
            });
          }
        }
      }
    } catch (error) {
      console.error(`Failed to create genre ${genre.name}:`, error);
    }
  }
  
  return results;
};

export const GenreService = {
  getAllGenres,
  getGenreById,
  getGenreBySlug,
  createGenre,
  updateGenre,
  deleteGenre,
  getPopularGenres,
  getGenresWithCount,
  bulkCreateGenres
};