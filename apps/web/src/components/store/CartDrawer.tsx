'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ArrowRight, Tag, ShieldCheck } from 'lucide-react';
import { useRamprsStore } from '@/lib/store/useRamprsStore';
import { formatRupees } from '@ramprs/shared';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeFromCart,
    appliedCoupon,
    applyCoupon,
    getSubtotalPaise,
    getDiscountPaise,
    getGstPaise,
    getShippingPaise,
    getTotalPaise,
  } = useRamprsStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isCartDrawerOpen) return null;

  const subtotal = getSubtotalPaise();
  const discount = getDiscountPaise();
  const gst = getGstPaise();
  const shipping = getShippingPaise();
  const total = getTotalPaise();

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'RAMPRS15') {
      applyCoupon({
        id: 'c1',
        code: 'RAMPRS15',
        discount_type: 'PERCENTAGE',
        discount_value: 15,
        min_order_paise: 149900,
        max_discount_paise: 50000,
        used_count: 0,
        is_active: true,
      });
      setCouponInput('');
    } else if (code === 'FESTIVE500') {
      applyCoupon({
        id: 'c2',
        code: 'FESTIVE500',
        discount_type: 'FLAT',
        discount_value: 500,
        min_order_paise: 299900,
        used_count: 0,
        is_active: true,
      });
      setCouponInput('');
    } else {
      setCouponError('Invalid coupon code. Try RAMPRS15 or FESTIVE500');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeCartDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-luxury uppercase text-black">
              Shopping Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h2>
            <button
              onClick={closeCartDrawer}
              className="text-neutral-400 hover:text-black p-1 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <p className="text-neutral-500 font-medium">Your shopping bag is empty.</p>
                <Link
                  href="/shop"
                  onClick={closeCartDrawer}
                  className="mt-4 px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                >
                  Explore Drops
                </Link>
              </div>
            ) : (
              cart.map(({ product, variant, quantity }) => (
                <div key={variant.id} className="flex gap-4 pb-6 border-b border-neutral-100">
                  <div className="relative w-20 h-24 bg-neutral-100 rounded-sm overflow-hidden flex-shrink-0">
                    <Image
                      src={variant.images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400'}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 line-clamp-1">
                          {product.title}
                        </h3>
                        <button
                          onClick={() => removeFromCart(variant.id)}
                          className="text-neutral-400 hover:text-rose-600 transition-colors ml-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Size: <span className="font-semibold text-black">{variant.size}</span> | Color: {variant.color_name}
                      </p>
                      <p className="text-[10px] font-mono text-neutral-400 mt-0.5">{variant.sku}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-neutral-200 rounded">
                        <button
                          onClick={() => updateQuantity(variant.id, quantity - 1)}
                          className="p-1 hover:bg-neutral-100 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2.5 text-xs font-semibold">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(variant.id, quantity + 1)}
                          className="p-1 hover:bg-neutral-100 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-black">
                        {formatRupees(variant.sale_price_paise * quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Price Calculation */}
          {cart.length > 0 && (
            <div className="p-6 bg-neutral-50 border-t border-neutral-200 space-y-4">
              {/* Coupon Bar */}
              <div className="space-y-1">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 text-xs px-3 py-2 rounded border border-emerald-200">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Tag size={13} /> {appliedCoupon.code} Applied (-{formatRupees(discount)})
                    </span>
                    <button
                      onClick={() => applyCoupon(null)}
                      className="text-emerald-700 hover:text-emerald-900 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo Code (e.g. RAMPRS15)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:border-black uppercase"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold uppercase rounded hover:bg-black transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {couponError && <p className="text-[11px] text-rose-600">{couponError}</p>}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-neutral-600 pt-2 border-t border-neutral-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900">{formatRupees(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-{formatRupees(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated GST (12%)</span>
                  <span className="font-semibold text-neutral-900">{formatRupees(gst)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Express Shipping</span>
                  <span className="font-semibold text-neutral-900">
                    {shipping === 0 ? <span className="text-emerald-600">FREE</span> : formatRupees(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-black pt-2 border-t border-neutral-200">
                  <span>Total</span>
                  <span>{formatRupees(total)}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/checkout"
                  onClick={closeCartDrawer}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-luxury hover:bg-neutral-800 transition-colors rounded-sm"
                >
                  Proceed to Secure Checkout <ArrowRight size={14} />
                </Link>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 mt-2 font-medium">
                  <ShieldCheck size={12} /> 100% Encrypted UPI / Card Checkout & 7-Day Size Exchange
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

