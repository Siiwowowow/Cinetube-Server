import { PlanType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import AppError from '../../errorHelpers/AppError.js';

const subscribeUser = async (userId: string, planType: PlanType) => {
  const amount = planType === 'MONTHLY' ? 9.99 : 99.99;
  const durationDays = planType === 'MONTHLY' ? 30 : 365;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create or Update user subscription
    const subscription = await tx.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planType,
        status: 'ACTIVE',
        endDate,
        autoRenew: true,
      },
      update: {
        planType,
        status: 'ACTIVE',
        endDate,
      },
    });

    // 2. Log History
    await tx.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        userId,
        planType,
        status: 'ACTIVE',
        startDate: subscription.startDate,
        endDate,
        amount,
      },
    });

    // 3. Log transaction
    await tx.transaction.create({
      data: {
        userId,
        amount,
        type: 'subscription',
        status: 'success',
        metadata: { planType },
      },
    });

    return subscription;
  });

  return result;
};

const purchaseMedia = async (userId: string, mediaId: string, paymentMethod: string) => {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
  });

  if (!media) {
    throw new AppError(404, 'Media not found');
  }

  const amount = media.price || 0;

  const result = await prisma.$transaction(async (tx) => {
    // Check if user already bought it
    const existing = await tx.purchase.findFirst({
      where: { userId, mediaId, status: 'COMPLETED' },
    });

    if (existing) {
      throw new AppError(400, 'You have already purchased this title');
    }

    const purchase = await tx.purchase.create({
      data: {
        userId,
        mediaId,
        amount,
        paymentId: `PAY-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        paymentMethod,
        status: 'COMPLETED',
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        amount,
        type: 'purchase',
        status: 'success',
        metadata: { mediaId, purchaseId: purchase.id },
      },
    });

    return purchase;
  });

  return result;
};

export const PaymentService = {
  subscribeUser,
  purchaseMedia,
};