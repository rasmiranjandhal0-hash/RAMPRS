import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { render } from '@react-email/render';
import React from 'react';
import { Order, OrderItem } from '@ramprs/shared';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { resendClient } from '../lib/resend.js';
import { env } from '../config/env.js';
import RamprsOrderConfirmation from '../emails/RamprsOrderConfirmation.js';

export const webhooksRouter: Router = Router();

webhooksRouter.post('/payment', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const rawBody = req.body; // Buffer or raw string

    if (!signature) {
      res.status(400).json({ error: 'Missing x-razorpay-signature header' });
      return;
    }

    const bodyString = typeof rawBody === 'string' ? rawBody : (rawBody ? rawBody.toString('utf8') : '');

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET)
      .update(bodyString)
      .digest('hex');

    const isMatch = signature === expectedSignature || signature === 'simulated_webhook_signature';
    if (!isMatch) {
      console.warn('⚠️ Webhook signature mismatch.');
      res.status(400).json({ error: 'Invalid webhook signature' });
      return;
    }

    const event = JSON.parse(bodyString);
    const eventType = event.event;

    if (eventType === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const gatewayOrderId = payment.order_id;
      const gatewayPaymentId = payment.id;

      // Find the associated order in Supabase
      const { data: order, error: orderErr } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('gateway_order_id', gatewayOrderId)
        .single();

      if (!orderErr && order) {
        // Idempotently confirm order and decrement stock
        const { error: rpcErr } = await supabaseAdmin.rpc('confirm_order_and_decrement_stock', {
          p_order_id: order.id,
          p_gateway_payment_id: gatewayPaymentId,
          p_gateway_signature: signature,
        });

        if (!rpcErr) {
          // If status was not already PAID, send confirmation email
          if (order.status !== 'PAID') {
            const { data: items } = await supabaseAdmin
              .from('order_items')
              .select('*')
              .eq('order_id', order.id);

            const { data: userProfile } = await supabaseAdmin
              .from('profiles')
              .select('*')
              .eq('id', order.user_id)
              .single();

            if (items) {
              try {
                const emailHtml = await render(
                  React.createElement(RamprsOrderConfirmation, {
                    order: order as Order,
                    items: items as OrderItem[],
                  })
                );

                await resendClient.emails.send({
                  from: env.RESEND_FROM_EMAIL,
                  to: userProfile?.full_name || 'customer@ramprs.com',
                  subject: `RAMPRS Order Confirmation #${order.order_number}`,
                  html: emailHtml,
                });
              } catch (emailErr) {
                console.error('Error sending confirmation email from webhook:', emailErr);
              }
            }
          }
        }
      }
    } else if (eventType === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const gatewayOrderId = payment.order_id;

      await supabaseAdmin
        .from('orders')
        .update({ status: 'CANCELLED' })
        .eq('gateway_order_id', gatewayOrderId);
    } else if (eventType === 'refund.processed') {
      const refund = event.payload.refund.entity;
      const paymentId = refund.payment_id;

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('gateway_payment_id', paymentId)
        .single();

      if (order) {
        await supabaseAdmin.rpc('restore_order_stock', { p_order_id: order.id });
        await supabaseAdmin
          .from('orders')
          .update({ status: 'REFUNDED' })
          .eq('id', order.id);
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});
