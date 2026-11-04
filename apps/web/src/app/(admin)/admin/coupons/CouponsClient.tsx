'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, Plus, Check, X, Trash2 } from 'lucide-react';
import { DiscountType, formatRupees } from '@ramprs/shared';
import { createClient } from '@/lib/supabase/client';

interface CouponsClientProps {
  initialCoupons: any[];
}

export const CouponsClient: React.FC<CouponsClientProps> = ({ initialCoupons }) => {
  const router = useRouter();
  const supabase = createClient();

  const [coupons, setCoupons] = useState(initialCoupons);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(15);
  const [minOrderRupees, setMinOrderRupees] = useState(999);
  const [maxDiscountRupees, setMaxDiscountRupees] = useState(500);
  const [usageLimit, setUsageLimit] = useState(1000);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    try {
      setSubmitting(true);
      setStatusMsg('');

      const { data: newCoupon, error } = await supabase
        .from('coupons')
        .insert({
          code: code.trim().toUpperCase(),
          discount_type: discountType,
          discount_value: Number(discountValue),
          min_order_paise: Math.round(Number(minOrderRupees) * 100),
          max_discount_paise: maxDiscountRupees ? Math.round(Number(maxDiscountRupees) * 100) : null,
          usage_limit: usageLimit ? Number(usageLimit) : null,
          used_count: 0,
          is_active: true,
        })
        .select('*')
        .single();

      if (error || !newCoupon) {
        throw new Error(error?.message || 'Failed to create coupon');
      }

      setCoupons([newCoupon, ...coupons]);
      setCode('');
      setStatusMsg(`Promo code ${newCoupon.code} created and live!`);
      router.refresh();
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !current })
      .eq('id', id);

    if (!error) {
      setCoupons(coupons.map((c) => (c.id === id ? { ...c, is_active: !current } : c)));
      router.refresh();
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="pb-4 border-b border-neutral-200">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Marketing & Conversions</span>
        <h1 className="text-2xl font-black uppercase tracking-luxury text-black mt-1">
          Coupon & Promotion Manager
        </h1>
      </div>

      {statusMsg && (
        <div className="p-3 bg-neutral-100 border border-neutral-300 rounded text-xs font-bold text-black">
          {statusMsg}
        </div>
      )}

      {/* Create Coupon Card */}
      <form onSubmit={handleCreateCoupon} className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm space-y-4 text-xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
          <Tag size={16} /> Create Promotional Code
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">Coupon Code</label>
            <input
              type="text"
              required
              placeholder="e.g. RAMPRS20"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded uppercase font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">Discount Type</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              className="w-full px-3 py-2 border border-neutral-300 rounded font-bold"
            >
              <option value="PERCENTAGE">PERCENTAGE (%)</option>
              <option value="FLAT">FLAT RUPEES (₹)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">
              Discount Value {discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
            </label>
            <input
              type="number"
              required
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-300 rounded font-bold"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">Minimum Order Value (₹)</label>
            <input
              type="number"
              value={minOrderRupees}
              onChange={(e) => setMinOrderRupees(Number(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-300 rounded"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">Maximum Discount Cap (₹)</label>
            <input
              type="number"
              value={maxDiscountRupees}
              onChange={(e) => setMaxDiscountRupees(Number(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-300 rounded"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">Usage Limit (Total Redemptions)</label>
            <input
              type="number"
              value={usageLimit}
              onChange={(e) => setUsageLimit(Number(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-300 rounded"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-black text-white rounded font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400"
          >
            {submitting ? 'Creating...' : 'Activate Coupon'}
          </button>
        </div>
      </form>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs divide-y divide-neutral-200">
            <thead className="bg-neutral-50 font-bold uppercase text-neutral-600">
              <tr>
                <th className="p-4 text-left">Code</th>
                <th className="p-4 text-left">Discount</th>
                <th className="p-4 text-left">Min Order</th>
                <th className="p-4 text-left">Max Discount</th>
                <th className="p-4 text-center">Redeemed</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="p-4 font-mono font-bold text-black">{c.code}</td>
                  <td className="p-4 font-semibold text-emerald-600">
                    {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT`}
                  </td>
                  <td className="p-4 text-neutral-700">{formatRupees(c.min_order_paise)}</td>
                  <td className="p-4 text-neutral-700">
                    {c.max_discount_paise ? formatRupees(c.max_discount_paise) : 'No Cap'}
                  </td>
                  <td className="p-4 text-center font-bold">
                    {c.used_count} / {c.usage_limit || '∞'}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {c.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleActive(c.id, c.is_active)}
                      className={`px-3 py-1 rounded text-[11px] font-bold uppercase ${
                        c.is_active ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {c.is_active ? 'Deactivate' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

