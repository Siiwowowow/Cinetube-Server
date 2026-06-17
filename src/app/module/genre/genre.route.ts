import { Router } from 'express';

import { Role } from '@prisma/client';
import { GenreController } from './genre.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { GenreValidation } from './genre.validation.js';
import { checkAuth } from '../../middleware/checkAuth.js';

const router = Router();

// Public routes (no authentication required)
router.get('/', GenreController.getAllGenres);
router.get('/popular', GenreController.getPopularGenres);
router.get('/with-count', GenreController.getGenresWithCount);
router.get('/slug/:slug', GenreController.getGenreBySlug);
router.get('/:id', validateRequest(GenreValidation.getGenreParamsSchema), GenreController.getGenreById);

// Admin only routes
router.post(
  '/',
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(GenreValidation.createGenreSchema),
  GenreController.createGenre
);

router.put(
  '/:id',
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(GenreValidation.updateGenreSchema),
  GenreController.updateGenre
);

router.delete(
  '/:id',
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(GenreValidation.getGenreParamsSchema),
  GenreController.deleteGenre
);

export const GenreRoutes = router;