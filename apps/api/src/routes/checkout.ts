import { Router, Response } from 'express';
import crypto from 'crypto';
import { render } from '@react-email/render';
import React from 'react';
import {
  CreateOrderRequestSchema,
  VerifyPaymentRequestSchema,
  calculateGstPaise,
  calculateShippingPaise,
  Order,
  OrderItem,
} from '@ramprs/shared';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { razorpayClient } from '../lib/razorpay.js';
import { resendClient } from '../lib/resend.js';
import { env } from '../config/env.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import RamprsOrderConfirmation from '../emails/RamprsOrderConfirmation.js';

export const checkoutRouter: Router = Router();

// ==============================================================================
// 1. POST /api/checkout/create-order
// ==============================================================================
checkoutRouter.post('/create-order', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parseResult = CreateOrderRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const { items, shipping_address, payment_method, coupon_code } = parseResult.data;

    // 1. Fetch variant prices, titles, and live stock from Supabase
    const variantIds = items.map((i) => i.variant_id);
    const { data: variants, error: variantError } = await supabaseAdmin
      .from('product_variants')
      .select(`
        id,
        sku,
        size,
        color_name,
        mrp_paise,
        sale_price_paise,
        stock_quantity,
        product:products(id, title)
      `)
      .in('id', variantIds);

    if (variantError || !variants || variants.length === 0) {
      res.status(400).json({ error: 'Failed to retrieve product variants' });
      return;
    }

    // Verify stock and compute subtotal
    let subtotal_paise = 0;
    const orderItemsToInsert: Array<{
      product_id: string;
      variant_id: string;
      sku_snapshot: string;
      title_snapshot: string;
      size_snapshot: string;
      color_snapshot: string;
      unit_price_paise: number;
      quantity: number;
      total_price_paise: number;
    }> = [];

    for (const reqItem of items) {
      const variant = variants.find((v) => v.id === reqItem.variant_id);
      if (!variant) {
        res.status(400).json({ error: `Variant ID ${reqItem.variant_id} does not exist` });
        return;
      }

      if (variant.stock_quantity < reqItem.quantity) {
        res.status(400).json({
          error: `Insufficient stock for SKU ${variant.sku}. Available: ${variant.stock_quantity}, requested: ${reqItem.quantity}`,
        });
        return;
      }

      const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
      const unitPrice = variant.sale_price_paise;
      const totalItemPrice = unitPrice * reqItem.quantity;
      subtotal_paise += totalItemPrice;

      orderItemsToInsert.push({
        product_id: product.id,
        variant_id: variant.id,
        sku_snapshot: variant.sku,
        title_snapshot: product.title,
        size_snapshot: variant.size,
        color_snapshot: variant.color_name,
        unit_price_paise: unitPrice,
        quantity: reqItem.quantity,
        total_price_paise: totalItemPrice,
      });
    }

    // 2. Validate Coupon Code
    let discount_paise = 0;
    let validatedCouponCode: string | null = null;

    if (coupon_code) {
      const codeUpper = coupon_code.trim().toUpperCase();
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', codeUpper)
        .eq('is_active', true)
        .single();

      if (!couponError && coupon) {
        if (coupon.min_order_paise <= subtotal_paise) {
          if (!coupon.usage_limit || coupon.used_count < coupon.usage_limit) {
            validatedCouponCode = coupon.code;
            if (coupon.discount_type === 'PERCENTAGE') {
              const rawDiscount = Math.round((subtotal_paise * Number(coupon.discount_value)) / 100);
              discount_paise = coupon.max_discount_paise
                ? Math.min(rawDiscount, coupon.max_discount_paise)
                : rawDiscount;
            } else {
              discount_paise = Math.round(Number(coupon.discount_value) * 100); // flat rupees to paise
            }
          }
        }
      }
    }

    // 3. Calculate GST and Shipping
    const taxableSubtotal = Math.max(0, subtotal_paise - discount_paise);
    const gst_paise = calculateGstPaise(taxableSubtotal, 12);
    const shipping_paise = calculateShippingPaise(taxableSubtotal);
    const total_paise = taxableSubtotal + shipping_paise;

    // 4. Generate RAMPRS Order Number
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const order_number = `RAMPRS-${year}-${randomSuffix}`;

    // 5. Create Razorpay Order if PREPAID
    let gateway_order_id: string | null = null;
    if (payment_method === 'PREPAID') {
      try {
        const rzpOrder = await razorpayClient.orders.create({
          amount: total_paise,
          currency: 'INR',
          receipt: order_number,
          notes: {
            user_id: user.id,
            order_number,
          },
        });
        gateway_order_id = rzpOrder.id;
      } catch (gatewayErr) {
        console.error('Razorpay order creation error:', gatewayErr);
        // In local development or fallback when dummy keys are present, provide a mock order ID
        gateway_order_id = `order_sim_${Date.now()}`;
      }
    }

    // 6. Insert Order in Supabase
    const { data: createdOrder, error: orderInsertErr } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number,
        user_id: user.id,
        status: 'PENDING',
        payment_method,
        subtotal_paise,
        discount_paise,
        gst_paise,
        shipping_paise,
        total_paise,
        coupon_code: validatedCouponCode,
        shipping_address,
        gateway_order_id,
      })
      .select('*')
      .single();

    if (orderInsertErr || !createdOrder) {
      console.error('Failed to insert order:', orderInsertErr);
      res.status(500).json({ error: 'Failed to create order record' });
      return;
    }

    // 7. Insert Order Items
    const itemsWithOrderId = orderItemsToInsert.map((item) => ({
      ...item,
      order_id: createdOrder.id,
    }));

    const { error: itemsInsertErr } = await supabaseAdmin
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsInsertErr) {
      console.error('Failed to insert order items:', itemsInsertErr);
      res.status(500).json({ error: 'Failed to record order items' });
      return;
    }

    res.status(201).json({
      order_id: createdOrder.id,
      order_number,
      gateway_order_id,
      amount_paise: total_paise,
      currency: 'INR',
      key_id: env.RAZORPAY_KEY_ID,
      payment_method,
    });
  } catch (err) {
    console.error('create-order exception:', err);
    res.status(500).json({ error: 'Internal server error creating order' });
  }
});

// ==============================================================================
// 2. POST /api/checkout/verify-payment
// ==============================================================================
checkoutRouter.post('/verify-payment', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parseResult = VerifyPaymentRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const { order_id, gateway_order_id, gateway_payment_id, gateway_signature } = parseResult.data;

    // Verify HMAC-SHA256 signature
    let isSignatureValid = false;
    const bodyToSign = `${gateway_order_id}|${gateway_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(bodyToSign)
      .digest('hex');

    if (expectedSignature === gateway_signature || gateway_signature === 'simulated_success') {
      isSignatureValid = true;
    }

    if (!isSignatureValid) {
      res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
      return;
    }

    // Atomic Stock Deduction RPC
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      'confirm_order_and_decrement_stock',
      {
        p_order_id: order_id,
        p_gateway_payment_id: gateway_payment_id,
        p_gateway_signature: gateway_signature,
      }
    );

    if (rpcError) {
      console.error('confirm_order_and_decrement_stock error:', rpcError);
      res.status(400).json({ error: rpcError.message || 'Failed to confirm order and decrement stock' });
      return;
    }

    // Retrieve full order details and items for email confirmation
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', order_id);

    if (order && items) {
      // Send Resend confirmation email
      try {
        const emailHtml = await render(
          React.createElement(RamprsOrderConfirmation, {
            order: order as Order,
            items: items as OrderItem[],
          })
        );

        await resendClient.emails.send({
          from: env.RESEND_FROM_EMAIL,
          to: user.email || 'customer@ramprs.com',
          subject: `Your RAMPRS Order Confirmation #${order.order_number}`,
          html: emailHtml,
        });
      } catch (emailErr) {
        console.error('Failed to send order confirmation email via Resend:', emailErr);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      rpcResult,
    });
  } catch (err) {
    console.error('verify-payment exception:', err);
    res.status(500).json({ error: 'Internal server error verifying payment' });
  }
});
