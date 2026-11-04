import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { CouponsClient } from './CouponsClient';

export const revalidate = 0;

export default async function AdminCouponsPage() {
  const supabase = createClient();

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  return <CouponsClient initialCoupons={coupons || []} />;
}

