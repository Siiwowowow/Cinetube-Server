import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { PaymentService } from './payment.service.js';
import { sendResponse } from '../../shared/sendResponse.js';

const subscribeUser = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.subscribeUser(req.user!.userId, req.body.planType, req.body.paymentMethodId);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Subscribed successfully',
    data: result,
  });
});

const purchaseMedia = catchAsync(async (req: Request, res: Response) => {
  const { mediaId, paymentMethod, paymentMethodId } = req.body;
  const result = await PaymentService.purchaseMedia(req.user!.userId, mediaId, paymentMethod, paymentMethodId);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Media purchased successfully',
    data: result,
  });
});

const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  try {
    const result = await PaymentService.handleWebhook(req.body, signature);
    res.status(200).json(result);
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

export const PaymentController = {
  subscribeUser,
  purchaseMedia,
  handleWebhook,
};