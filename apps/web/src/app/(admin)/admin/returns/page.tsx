import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { AdminReturnsClient } from './AdminReturnsClient';

export const revalidate = 0;

export default async function AdminReturnsPage() {
  const supabase = createClient();

  const { data: rmaList } = await supabase
    .from('rma_requests')
    .select(`
      *,
      order:orders(order_number, created_at),
      item:order_items(sku_snapshot, title_snapshot, size_snapshot, variant_id),
      user:profiles(full_name)
    `)
    .order('created_at', { ascending: false });

  return <AdminReturnsClient initialRmaList={rmaList || []} />;
}

