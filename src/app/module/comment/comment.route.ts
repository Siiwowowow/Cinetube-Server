import { Router } from 'express';

import { z } from 'zod';
import { CommentController } from './comment.controller.js';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();

const commentValidation = {
  create: z.object({
    body: z.object({
      content: z.string().min(1, 'Comment cannot be empty'),
      reviewId: z.string(),
      parentId: z.string().optional()
    })
  }),
  update: z.object({
    body: z.object({
      content: z.string().min(1, 'Comment cannot be empty')
    })
  })
};

router.get('/review/:reviewId', CommentController.getCommentsByReview);

router.post(
  '/',
  checkAuth(),
  validateRequest(commentValidation.create),
  CommentController.createComment
);

router.put(
  '/:id',
  checkAuth(),
  validateRequest(commentValidation.update),
  CommentController.updateComment
);

router.delete('/:id', checkAuth(), CommentController.deleteComment);

router.post('/review/:reviewId/like', checkAuth(), CommentController.toggleLikeReview);
router.post('/comment/:commentId/like', checkAuth(), CommentController.toggleLikeComment);

export const CommentRoutes = router;