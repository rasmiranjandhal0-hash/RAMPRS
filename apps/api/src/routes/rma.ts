import { Router, Response } from 'express';
import { RmaRequestSchema } from '@ramprs/shared';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const rmaRouter: Router = Router();

// ==============================================================================
// 1. POST /api/rma/request
// ==============================================================================
rmaRouter.post('/request', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parseResult = RmaRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const { order_id, order_item_id, type, reason, requested_size } = parseResult.data;

    // Verify order belongs to the user and is delivered or eligible
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (orderErr || !order) {
      res.status(404).json({ error: 'Order not found or does not belong to user' });
      return;
    }

    if (order.status !== 'DELIVERED' && order.status !== 'PAID' && order.status !== 'SHIPPED') {
      res.status(400).json({ error: `Cannot request ${type.toLowerCase()} for order with status ${order.status}` });
      return;
    }

    // Verify order item exists
    const { data: item, error: itemErr } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('id', order_item_id)
      .eq('order_id', order_id)
      .single();

    if (itemErr || !item) {
      res.status(404).json({ error: 'Order item not found in this order' });
      return;
    }

    // Insert RMA Request
    const { data: rmaRecord, error: rmaErr } = await supabaseAdmin
      .from('rma_requests')
      .insert({
        order_id,
        order_item_id,
        user_id: user.id,
        type,
        reason,
        requested_size: requested_size || null,
        status: 'PENDING',
      })
      .select('*')
      .single();

    if (rmaErr) {
      console.error('Failed to create RMA request:', rmaErr);
      res.status(500).json({ error: 'Failed to create return/exchange request' });
      return;
    }

    // Update order status to indicate active return request
    await supabaseAdmin
      .from('orders')
      .update({ status: 'RETURN_REQUESTED' })
      .eq('id', order_id);

    res.status(201).json({
      success: true,
      message: `${type === 'EXCHANGE' ? 'Size exchange' : 'Return'} request submitted successfully`,
      rma: rmaRecord,
    });
  } catch (err) {
    console.error('rma/request exception:', err);
    res.status(500).json({ error: 'Internal server error processing return request' });
  }
});

// ==============================================================================
// 2. GET /api/rma/my-requests
// ==============================================================================
rmaRouter.get('/my-requests', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { data: requests, error } = await supabaseAdmin
      .from('rma_requests')
      .select(`
        *,
        order:orders(order_number, created_at, status),
        item:order_items(sku_snapshot, title_snapshot, size_snapshot, color_snapshot)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Failed to fetch RMA requests' });
      return;
    }

    res.status(200).json({ requests });
  } catch (err) {
    console.error('rma/my-requests exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
