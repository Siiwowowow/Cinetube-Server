import { Router } from 'express';

import { Role } from '@prisma/client';
import { MediaController } from './media.controller.js';
import { checkAuth } from '../../middleware/checkAuth.js';
import { mediaValidation } from './media.validation.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();

// Public routes
router.get('/', MediaController.getAllMedia);
router.get('/top-rated', MediaController.getTopRated);
router.get('/trending', MediaController.getTrending);
router.get('/newly-added', MediaController.getNewlyAdded);
router.get('/editor-picks', MediaController.getEditorPicks);
router.get('/:id', MediaController.getMediaById);

// Admin only routes
router.post(
  '/',
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(mediaValidation.createMedia),
  MediaController.createMedia
);

router.put(
  '/:id',
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(mediaValidation.updateMedia),
  MediaController.updateMedia
);

router.delete(
  '/:id',
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  MediaController.deleteMedia
);

export const MediaRoutes = router;