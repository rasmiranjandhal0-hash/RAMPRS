import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { AdminOrdersClient } from './AdminOrdersClient';

export const revalidate = 0;

export default async function AdminOrdersPage() {
  const supabase = createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .order('created_at', { ascending: false });

  return <AdminOrdersClient initialOrders={orders || []} />;
}

