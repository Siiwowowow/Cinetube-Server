import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { checkAuth } from '../../middleware/checkAuth.js';

const router = Router();

// Protect all payment routes with authentication
router.use(checkAuth());

router.post('/subscribe', PaymentController.subscribeUser);
router.post('/purchase', PaymentController.purchaseMedia);

export const PaymentRoutes = router;