import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { PaymentService } from './payment.service.js';
import { sendResponse } from '../../shared/sendResponse.js';

const subscribeUser = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.subscribeUser(req.user!.userId, req.body.planType);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Subscribed successfully',
    data: result,
  });
});

const purchaseMedia = catchAsync(async (req: Request, res: Response) => {
  const { mediaId, paymentMethod } = req.body;
  const result = await PaymentService.purchaseMedia(req.user!.userId, mediaId, paymentMethod);
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: 'Media purchased successfully',
    data: result,
  });
});

export const PaymentController = {
  subscribeUser,
  purchaseMedia,
};