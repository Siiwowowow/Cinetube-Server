/* eslint-disable preserve-caught-error */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PlanType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import AppError from '../../errorHelpers/AppError.js';
import { stripe } from '../../config/stripe.config.js';
import { envVars } from '../../config/env.js';
import { sendEmail } from '../../utils/email.js';

const getOrCreateStripeCustomer = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
};

const subscribeUser = async (userId: string, planType: PlanType, paymentMethodId?: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const amount = planType === 'MONTHLY' ? 9.99 : 99.99;
  const durationDays = planType === 'MONTHLY' ? 30 : 365;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);

  const stripeCustomerId = await getOrCreateStripeCustomer(userId);

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: stripeCustomerId,
      payment_method: paymentMethodId || 'pm_card_visa',
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        userId,
        type: 'subscription',
        planType,
      },
    });
  } catch (err: any) {
    console.error('Stripe Payment Intent error:', err);
    throw new AppError(400, `Payment failed: ${err.message}`);
  }

  if (paymentIntent.status !== 'succeeded') {
    throw new AppError(400, `Payment failed: Status is ${paymentIntent.status}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planType,
        status: 'ACTIVE',
        endDate,
        autoRenew: true,
        stripeCustomerId,
        stripeSubscriptionId: paymentIntent.id,
      },
      update: {
        planType,
        status: 'ACTIVE',
        endDate,
        stripeCustomerId,
        stripeSubscriptionId: paymentIntent.id,
      },
    });

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

    await tx.transaction.create({
      data: {
        userId,
        amount,
        type: 'subscription',
        status: 'success',
        stripePaymentIntentId: paymentIntent.id,
        metadata: { planType, stripePaymentIntentId: paymentIntent.id },
      },
    });

    return subscription;
  });

  // Send confirmation email
  try {
    await sendEmail({
      to: user.email,
      subject: "Your CineRate Subscription Invoice",
      templateName: "invoice",
      templateData: {
        name: user.name || "Customer",
        transactionId: paymentIntent.id,
        date: new Date().toLocaleDateString(),
        description: `CineRate Premium Subscription - ${planType}`,
        amount: amount,
      }
    });
  } catch (emailErr) {
    console.error("Failed to send subscription confirmation email:", emailErr);
  }

  return result;
};

const purchaseMedia = async (userId: string, mediaId: string, paymentMethod: string, paymentMethodId?: string) => {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
  });

  if (!media) {
    throw new AppError(404, 'Media not found');
  }

  const amount = media.price || 0;

  const existing = await prisma.purchase.findFirst({
    where: { userId, mediaId, status: 'COMPLETED' },
  });

  if (existing) {
    throw new AppError(400, 'You have already purchased this title');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true }
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  let paymentIntentId = `PAY-SIM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  if (paymentMethod === 'Credit Card (Stripe)' || paymentMethod.toLowerCase().includes('stripe')) {
    const stripeCustomerId = await getOrCreateStripeCustomer(userId);

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        customer: stripeCustomerId,
        payment_method: paymentMethodId || 'pm_card_visa',
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata: {
          userId,
          type: 'purchase',
          mediaId,
        },
      });

      if (paymentIntent.status !== 'succeeded') {
        throw new AppError(400, `Payment failed: Status is ${paymentIntent.status}`);
      }

      paymentIntentId = paymentIntent.id;
    } catch (err: any) {
      console.error('Stripe Purchase error:', err);
      throw new AppError(400, `Payment failed: ${err.message}`);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingTx = await tx.purchase.findFirst({
      where: { userId, mediaId, status: 'COMPLETED' },
    });
    if (existingTx) {
      throw new AppError(400, 'You have already purchased this title');
    }

    const purchase = await tx.purchase.create({
      data: {
        userId,
        mediaId,
        amount,
        paymentId: paymentIntentId,
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
        stripePaymentIntentId: paymentIntentId.startsWith('pi_') ? paymentIntentId : null,
        metadata: { mediaId, purchaseId: purchase.id, paymentId: paymentIntentId },
      },
    });

    return purchase;
  });

  // Send confirmation email
  try {
    await sendEmail({
      to: user.email,
      subject: "Your CineRate Purchase Invoice",
      templateName: "invoice",
      templateData: {
        name: user.name || "Customer",
        transactionId: paymentIntentId,
        date: new Date().toLocaleDateString(),
        description: `CineRate Purchase - ${media.title}`,
        amount: amount,
      }
    });
  } catch (emailErr) {
    console.error("Failed to send purchase confirmation email:", emailErr);
  }

  return result;
};

const handleWebhook = async (rawBody: Buffer, signature: string) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      envVars.STRIPE.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    throw new Error(`Signature verification failed: ${err.message}`);
  }

  console.log(`Received stripe webhook event type: ${event.type}`);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as any;
    const { userId, type, planType, mediaId } = paymentIntent.metadata || {};

    if (!userId || !type) {
      console.log('PaymentIntent succeeded without complete application metadata. Skipping db update.');
      return { received: true, info: 'no metadata' };
    }

    console.log(`Processing webhook payment intent ${paymentIntent.id} for user ${userId}, type: ${type}`);

    if (type === 'subscription') {
      const plan = planType as PlanType;
      const amount = plan === 'MONTHLY' ? 9.99 : 99.99;
      const durationDays = plan === 'MONTHLY' ? 30 : 365;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });

      let wasCreated = false;

      await prisma.$transaction(async (tx) => {
        const existingTx = await tx.transaction.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (existingTx) {
          console.log(`Transaction for ${paymentIntent.id} already exists. Webhook skipped database write.`);
          return;
        }

        wasCreated = true;

        const subscription = await tx.subscription.upsert({
          where: { userId },
          create: {
            userId,
            planType: plan,
            status: 'ACTIVE',
            endDate,
            autoRenew: true,
            stripeCustomerId: paymentIntent.customer as string,
            stripeSubscriptionId: paymentIntent.id,
          },
          update: {
            planType: plan,
            status: 'ACTIVE',
            endDate,
            stripeCustomerId: paymentIntent.customer as string,
            stripeSubscriptionId: paymentIntent.id,
          },
        });

        await tx.subscriptionHistory.create({
          data: {
            subscriptionId: subscription.id,
            userId,
            planType: plan,
            status: 'ACTIVE',
            startDate: subscription.startDate,
            endDate,
            amount,
          },
        });

        await tx.transaction.create({
          data: {
            userId,
            amount,
            type: 'subscription',
            status: 'success',
            stripePaymentIntentId: paymentIntent.id,
            metadata: { planType: plan, stripePaymentIntentId: paymentIntent.id },
          },
        });
      });

      if (wasCreated && user) {
        try {
          await sendEmail({
            to: user.email,
            subject: "Your CineRate Subscription Invoice",
            templateName: "invoice",
            templateData: {
              name: user.name || "Customer",
              transactionId: paymentIntent.id,
              date: new Date().toLocaleDateString(),
              description: `CineRate Premium Subscription - ${plan}`,
              amount: amount,
            }
          });
        } catch (emailErr) {
          console.error("Failed to send subscription confirmation email from webhook:", emailErr);
        }
      }
    } else if (type === 'purchase') {
      const media = await prisma.media.findUnique({
        where: { id: mediaId },
      });

      if (!media) {
        console.error(`Media not found for purchase: ${mediaId}`);
        return { received: true, error: 'media not found' };
      }

      const amount = media.price || 0;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });

      let wasCreated = false;

      await prisma.$transaction(async (tx) => {
        const existingTx = await tx.transaction.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (existingTx) {
          console.log(`Transaction for ${paymentIntent.id} already exists. Webhook skipped database write.`);
          return;
        }

        wasCreated = true;

        const purchase = await tx.purchase.create({
          data: {
            userId,
            mediaId,
            amount,
            paymentId: paymentIntent.id,
            paymentMethod: 'Credit Card (Stripe)',
            status: 'COMPLETED',
          },
        });

        await tx.transaction.create({
          data: {
            userId,
            amount,
            type: 'purchase',
            status: 'success',
            stripePaymentIntentId: paymentIntent.id,
            metadata: { mediaId, purchaseId: purchase.id, paymentId: paymentIntent.id },
          },
        });
      });

      if (wasCreated && user) {
        try {
          await sendEmail({
            to: user.email,
            subject: "Your CineRate Purchase Invoice",
            templateName: "invoice",
            templateData: {
              name: user.name || "Customer",
              transactionId: paymentIntent.id,
              date: new Date().toLocaleDateString(),
              description: `CineRate Purchase - ${media.title}`,
              amount: amount,
            }
          });
        } catch (emailErr) {
          console.error("Failed to send purchase confirmation email from webhook:", emailErr);
        }
      }
    }
  }

  return { received: true };
};

export const PaymentService = {
  subscribeUser,
  purchaseMedia,
  handleWebhook,
};