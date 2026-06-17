import { Router } from 'express';

import { Role } from '@prisma/client';
import { ReviewController } from './review.controller.js';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { reviewValidation } from './review.validation.js';

const router = Router();

router.get('/', ReviewController.getAllReviews);
router.get('/:id', ReviewController.getReviewById);

router.post(
  '/',
  checkAuth(),
  validateRequest(reviewValidation.createReview),
  ReviewController.createReview
);

router.get('/user/media/:mediaId', checkAuth(), ReviewController.getUserReviewForMedia);

router.put(
  '/:id',
  checkAuth(),
  validateRequest(reviewValidation.updateReview),
  ReviewController.updateReview
);

router.delete('/:id', checkAuth(), ReviewController.deleteReview);

router.patch(
  '/:id/status',
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(reviewValidation.updateStatus),
  ReviewController.updateReviewStatus
);

export const ReviewRoutes = router;