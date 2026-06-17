import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync.js';
import { GenreService } from './genre.service.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { IRequestUser } from '../../interfaces/requestUser.interface.js';


// Get all genres
const getAllGenres = catchAsync(async (req: Request, res: Response) => {
  const result = await GenreService.getAllGenres();
  
  sendResponse(res, {
    success: true,
    httpCode: 200,
    message: 'Genres retrieved successfully',
    data: result
  });
});

// Get genre by ID
const getGenreById = catchAsync(async (req: Request, res: Response) => {
  const result = await GenreService.getGenreById(req.params.id as string);
  
  sendResponse(res, {
    success: true,
    httpCode: 200,
    message: 'Genre retrieved successfully',
    data: result
  });
});

// Get genre by slug
const getGenreBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await GenreService.getGenreBySlug(req.params.slug as string);
  
  sendResponse(res, {
    success: true,
    httpCode: 200,
    message: 'Genre retrieved successfully',
    data: result
  });
});

// Create new genre (Admin only)
const createGenre = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await GenreService.createGenre(req.body, user?.userId);
  
  sendResponse(res, {
    success: true,
    httpCode: 201,
    message: 'Genre created successfully',
    data: result
  });
});

// Update genre (Admin only)
const updateGenre = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await GenreService.updateGenre(req.params.id as string, req.body, user.userId);
  
  sendResponse(res, {
    success: true,
    httpCode: 200,
    message: 'Genre updated successfully',
    data: result
  });
});

// Delete genre (Admin only)
const deleteGenre = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await GenreService.deleteGenre(req.params.id as string, user.userId);
  
  sendResponse(res, {
    success: true,
    httpCode: 200,
    message: 'Genre deleted successfully',
    data: result
  });
});

// Get popular genres
const getPopularGenres = catchAsync(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const result = await GenreService.getPopularGenres(limit);
  
  sendResponse(res, {
    success: true,
    httpCode: 200,
    message: 'Popular genres retrieved successfully',
    data: result
  });
});

// Get genres with media count
const getGenresWithCount = catchAsync(async (req: Request, res: Response) => {
  const result = await GenreService.getGenresWithCount();
  
  sendResponse(res, {
    success: true,
    httpCode: 200,
    message: 'Genres with count retrieved successfully',
    data: result
  });
});

export const GenreController = {
  getAllGenres,
  getGenreById,
  getGenreBySlug,
  createGenre,
  updateGenre,
  deleteGenre,
  getPopularGenres,
  getGenresWithCount
};