import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ArrowRight, Package, Printer } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatRupees } from '@ramprs/shared';

interface OrderSuccessPageProps {
  params: {
    id: string;
  };
}

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const supabase = createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('id', params.id)
    .single();

  if (error || !order) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-10">
      {/* Animated Success Badge */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-2 animate-bounce">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-luxury text-black">
          Order Confirmed!
        </h1>
        <p className="text-xs text-neutral-500 font-medium">
          Order Number: <span className="font-mono font-bold text-neutral-900">{order.order_number}</span>
        </p>
        <p className="text-xs text-neutral-600 max-w-md mx-auto">
          We have received your order and our atelier has initiated preparation. An itemized receipt and tracking alert will be dispatched to your email.
        </p>
      </div>

      {/* Itemized Receipt Box */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">RAMPRS Atelier Receipt</span>
            <p className="text-xs text-neutral-500 mt-0.5">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold uppercase rounded-full border border-emerald-200">
            {order.status}
          </span>
        </div>

        {/* Ordered Garments */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black">Ordered Garments</h3>
          <div className="divide-y divide-neutral-100">
            {order.items?.map((item: any) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-neutral-900">{item.title_snapshot}</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    SKU: {item.sku_snapshot} | Size: {item.size_snapshot} | Color: {item.color_snapshot} | Qty: {item.quantity}
                  </p>
                </div>
                <span className="font-bold text-black">{formatRupees(item.total_price_paise)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-neutral-200 pt-4 space-y-2 text-xs text-neutral-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-neutral-900">{formatRupees(order.subtotal_paise)}</span>
          </div>
          {order.discount_paise > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Discount ({order.coupon_code || 'PROMO'})</span>
              <span>-{formatRupees(order.discount_paise)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Apparel GST (12% Included)</span>
            <span className="font-semibold text-neutral-900">{formatRupees(order.gst_paise)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="font-semibold text-neutral-900">
              {order.shipping_paise === 0 ? 'FREE' : formatRupees(order.shipping_paise)}
            </span>
          </div>
          <div className="flex justify-between text-base font-black text-black pt-3 border-t border-neutral-200">
            <span>Amount Paid</span>
            <span>{formatRupees(order.total_paise)}</span>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="border-t border-neutral-200 pt-4 text-xs">
          <h3 className="font-bold uppercase tracking-wider text-black mb-1">Delivering To</h3>
          <p className="text-neutral-600 leading-relaxed">
            {order.shipping_address.full_name}<br />
            {order.shipping_address.line1}, {order.shipping_address.line2 ? `${order.shipping_address.line2}, ` : ''}
            {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}<br />
            Phone: +91 {order.shipping_address.phone}
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/account"
          className="w-full sm:w-auto px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-luxury hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 rounded-sm"
        >
          <Package size={14} /> View in My Account
        </Link>
        <Link
          href="/shop"
          className="w-full sm:w-auto px-6 py-3 border border-neutral-300 text-neutral-800 text-xs font-bold uppercase tracking-wider hover:border-black transition-colors flex items-center justify-center gap-2 rounded-sm"
        >
          Continue Shopping <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

