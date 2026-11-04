import { Router, Response } from 'express';
import { render } from '@react-email/render';
import React from 'react';
import { OrderStatusUpdateSchema, ResolveRmaRequestSchema, Order, RmaRecord } from '@ramprs/shared';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { resendClient } from '../lib/resend.js';
import { env } from '../config/env.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import RamprsOrderShipped from '../emails/RamprsOrderShipped.js';
import RamprsRmaStatus from '../emails/RamprsRmaStatus.js';

export const adminRouter: Router = Router();

// ==============================================================================
// 1. PATCH /api/admin/orders/:id/fulfill
// ==============================================================================
adminRouter.patch('/orders/:id/fulfill', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = OrderStatusUpdateSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const { status, courier_name, awb_tracking_number, tracking_url } = parseResult.data;

    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status,
        courier_name: courier_name || null,
        awb_tracking_number: awb_tracking_number || null,
        tracking_url: tracking_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr || !updatedOrder) {
      console.error('Failed to update order fulfillment:', updateErr);
      res.status(500).json({ error: 'Failed to update order status' });
      return;
    }

    // If status is SHIPPED, trigger Resend shipping notification email
    if (status === 'SHIPPED' && courier_name && awb_tracking_number) {
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', updatedOrder.user_id)
        .single();

      try {
        const emailHtml = await render(
          React.createElement(RamprsOrderShipped, {
            order: updatedOrder as Order,
            courierName: courier_name,
            awbNumber: awb_tracking_number,
            trackingUrl: tracking_url || `https://track.delhivery.com/?awb=${awb_tracking_number}`,
          })
        );

        await resendClient.emails.send({
          from: env.RESEND_FROM_EMAIL,
          to: userProfile?.full_name || 'customer@ramprs.com',
          subject: `Your RAMPRS Order #${updatedOrder.order_number} Has Been Shipped!`,
          html: emailHtml,
        });
      } catch (emailErr) {
        console.error('Failed to send shipping email via Resend:', emailErr);
      }
    }

    res.status(200).json({
      success: true,
      message: `Order #${updatedOrder.order_number} updated to ${status}`,
      order: updatedOrder,
    });
  } catch (err) {
    console.error('fulfill exception:', err);
    res.status(500).json({ error: 'Internal server error fulfilling order' });
  }
});

// ==============================================================================
// 2. POST /api/admin/rma/:id/resolve
// ==============================================================================
adminRouter.post('/rma/:id/resolve', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = ResolveRmaRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const { status, admin_notes, exchange_variant_id } = parseResult.data;

    // Fetch the RMA request along with associated order and item
    const { data: rma, error: rmaErr } = await supabaseAdmin
      .from('rma_requests')
      .select(`
        *,
        order:orders(*),
        item:order_items(*)
      `)
      .eq('id', id)
      .single();

    if (rmaErr || !rma) {
      res.status(404).json({ error: 'RMA request not found' });
      return;
    }

    // If approving an EXCHANGE, verify and reserve replacement stock
    if (status === 'APPROVED' && rma.type === 'EXCHANGE') {
      const targetVariantId = exchange_variant_id || rma.item?.variant_id;
      if (targetVariantId) {
        const { data: variant, error: varErr } = await supabaseAdmin
          .from('product_variants')
          .select('stock_quantity, sku')
          .eq('id', targetVariantId)
          .single();

        if (varErr || !variant || variant.stock_quantity < 1) {
          res.status(400).json({
            error: `Cannot approve exchange: insufficient inventory for replacement variant (${variant?.sku || 'Unknown'})`,
          });
          return;
        }

        // Decrement 1 replacement unit
        await supabaseAdmin
          .from('product_variants')
          .update({ stock_quantity: variant.stock_quantity - 1 })
          .eq('id', targetVariantId);
      }
    }

    // If approving/completing a RETURN with REFUND, restore stock to original variant
    if ((status === 'COMPLETED' || status === 'APPROVED') && rma.type === 'RETURN') {
      await supabaseAdmin.rpc('restore_order_stock', { p_order_id: rma.order_id });
      await supabaseAdmin
        .from('orders')
        .update({ status: 'REFUNDED' })
        .eq('id', rma.order_id);
    }

    // Update the RMA status
    const { data: updatedRma, error: updateRmaErr } = await supabaseAdmin
      .from('rma_requests')
      .update({
        status,
        admin_notes: admin_notes || null,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateRmaErr || !updatedRma) {
      res.status(500).json({ error: 'Failed to update RMA record' });
      return;
    }

    // Send Resend status notification email to customer
    const { data: customerProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', rma.user_id)
      .single();

    try {
      const emailHtml = await render(
        React.createElement(RamprsRmaStatus, {
          rma: updatedRma as RmaRecord,
          customerName: customerProfile?.full_name || 'Valued Customer',
          orderNumber: rma.order?.order_number || 'RAMPRS-ORDER',
        })
      );

      await resendClient.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: customerProfile?.full_name || 'customer@ramprs.com',
        subject: `Update on your RAMPRS ${rma.type === 'EXCHANGE' ? 'Size Exchange' : 'Return'} Request`,
        html: emailHtml,
      });
    } catch (emailErr) {
      console.error('Failed to send RMA status email:', emailErr);
    }

    res.status(200).json({
      success: true,
      message: `RMA request marked as ${status}`,
      rma: updatedRma,
    });
  } catch (err) {
    console.error('resolve rma exception:', err);
    res.status(500).json({ error: 'Internal server error resolving return/exchange request' });
  }
});

// ==============================================================================
// 3. GET /api/admin/dashboard-stats
// ==============================================================================
adminRouter.get('/dashboard-stats', requireAdmin, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // 1. Total revenue and total orders
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select('total_paise, status, created_at');

    if (ordersErr) {
      res.status(500).json({ error: 'Failed to fetch order statistics' });
      return;
    }

    const paidOrders = orders.filter((o) => o.status !== 'CANCELLED');
    const totalRevenuePaise = paidOrders.reduce((sum, o) => sum + (o.total_paise || 0), 0);
    const aovPaise = paidOrders.length > 0 ? Math.round(totalRevenuePaise / paidOrders.length) : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const ordersToday = orders.filter((o) => o.created_at.startsWith(todayStr)).length;
    const pendingShipments = orders.filter((o) => o.status === 'PAID' || o.status === 'PACKED').length;

    // 2. Open RMA Requests
    const { count: openRmaCount } = await supabaseAdmin
      .from('rma_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['PENDING', 'APPROVED', 'PICKUP_SCHEDULED']);

    // 3. Low stock variants (stock <= 5)
    const { data: lowStockVariants } = await supabaseAdmin
      .from('product_variants')
      .select(`
        id,
        sku,
        size,
        color_name,
        stock_quantity,
        product:products(title, slug)
      `)
      .lte('stock_quantity', 5)
      .order('stock_quantity', { ascending: true })
      .limit(10);

    res.status(200).json({
      totalRevenuePaise,
      totalOrdersCount: orders.length,
      ordersToday,
      aovPaise,
      pendingShipments,
      openRmaCount: openRmaCount || 0,
      lowStockVariants: lowStockVariants || [],
    });
  } catch (err) {
    console.error('dashboard-stats error:', err);
    res.status(500).json({ error: 'Internal server error computing stats' });
  }
});
