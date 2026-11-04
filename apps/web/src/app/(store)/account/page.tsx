import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AccountClientView } from './AccountClientView';

export const revalidate = 0; // Dynamic server component

export default async function AccountPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/account');
  }

  // Fetch customer profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch orders with item details
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch active RMA requests
  const { data: rmaRequests } = await supabase
    .from('rma_requests')
    .select(`
      *,
      order:orders(order_number),
      item:order_items(title_snapshot, sku_snapshot, size_snapshot)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <AccountClientView
        user={user}
        profile={profile}
        orders={orders || []}
        rmaRequests={rmaRequests || []}
      />
    </div>
  );
}

