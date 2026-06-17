import { Router } from 'express';

import { Role } from '@prisma/client';
import { checkAuth } from '../../middleware/checkAuth.js';
import { AdminDashboardController } from './adminDashboard.controller.js';

const router = Router();

router.use(checkAuth(Role.ADMIN, Role.SUPER_ADMIN));

router.get('/stats', AdminDashboardController.getDashboardStats);
router.get('/pending-reviews', AdminDashboardController.getPendingReviews);
router.get('/user-activity', AdminDashboardController.getUserActivityReport);
router.get('/content-report', AdminDashboardController.getContentReport);

export const AdminDashboardRoutes = router;