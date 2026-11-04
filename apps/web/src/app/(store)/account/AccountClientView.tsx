'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Heart,
  User,
  LogOut,
  RefreshCw,
  ExternalLink,
  Printer,
  X,
  CheckCircle,
  Truck,
  Box,
} from 'lucide-react';
import { formatRupees, ClothingSize } from '@ramprs/shared';
import { createClient } from '@/lib/supabase/client';
import { useRamprsStore } from '@/lib/store/useRamprsStore';

interface AccountClientViewProps {
  user: any;
  profile: any;
  orders: any[];
  rmaRequests: any[];
}

export const AccountClientView: React.FC<AccountClientViewProps> = ({
  user,
  profile,
  orders,
  rmaRequests,
}) => {
  const router = useRouter();
  const supabase = createClient();
  const { wishlist, removeFromCart } = useRamprsStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'returns' | 'wishlist'>('orders');

  // RMA Modal State
  const [rmaModalOpen, setRmaModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rmaType, setRmaType] = useState<'EXCHANGE' | 'RETURN'>('EXCHANGE');
  const [requestedSize, setRequestedSize] = useState<ClothingSize>('L');
  const [rmaReason, setRmaReason] = useState('');
  const [rmaSubmitting, setRmaSubmitting] = useState(false);
  const [rmaMessage, setRmaMessage] = useState('');

  // Invoice Modal State
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<any>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleOpenRmaModal = (order: any, item: any) => {
    setSelectedOrder(order);
    setSelectedItem(item);
    setRmaType('EXCHANGE');
    setRequestedSize('L');
    setRmaReason('');
    setRmaMessage('');
    setRmaModalOpen(true);
  };

  const handleSubmitRma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedItem || !rmaReason) return;

    try {
      setRmaSubmitting(true);
      setRmaMessage('');

      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const res = await fetch(`${apiUrl}/api/rma/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          order_item_id: selectedItem.id,
          type: rmaType,
          reason: rmaReason,
          requested_size: rmaType === 'EXCHANGE' ? requestedSize : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setRmaMessage('Request submitted successfully! Our concierge team will review it.');
      setTimeout(() => {
        setRmaModalOpen(false);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setRmaMessage(`Error: ${err.message}`);
    } finally {
      setRmaSubmitting(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PAID':
        return 1;
      case 'PACKED':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="space-y-8">
      {/* Account Overview Header */}
      <div className="p-6 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">RAMPRS Member</span>
          <h1 className="text-2xl font-black uppercase tracking-luxury text-black mt-1">
            {profile?.full_name || user.email}
          </h1>
          <p className="text-xs text-neutral-500">{user.email}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 border border-neutral-300 rounded text-xs font-bold uppercase hover:border-black flex items-center gap-1.5 transition-colors"
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-200 gap-6 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 flex items-center gap-1.5 transition-colors ${
            activeTab === 'orders'
              ? 'border-b-2 border-black text-black'
              : 'text-neutral-500 hover:text-black'
          }`}
        >
          <Package size={15} /> Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-3 flex items-center gap-1.5 transition-colors ${
            activeTab === 'returns'
              ? 'border-b-2 border-black text-black'
              : 'text-neutral-500 hover:text-black'
          }`}
        >
          <RefreshCw size={15} /> Exchanges & Returns ({rmaRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`pb-3 flex items-center gap-1.5 transition-colors ${
            activeTab === 'wishlist'
              ? 'border-b-2 border-black text-black'
              : 'text-neutral-500 hover:text-black'
          }`}
        >
          <Heart size={15} /> Saved Fits ({wishlist.length})
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 rounded border border-neutral-200">
              <Package size={32} className="mx-auto text-neutral-400 mb-2" />
              <h3 className="text-sm font-bold uppercase text-neutral-800">No Orders Placed Yet</h3>
              <p className="text-xs text-neutral-500 mt-1">Explore our latest drops to initiate your wardrobe.</p>
            </div>
          ) : (
            orders.map((order) => {
              const currentStep = getStatusStep(order.status);

              return (
                <div key={order.id} className="bg-white border border-neutral-200 rounded-lg p-6 space-y-6">
                  {/* Order Card Header */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-neutral-100 gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-black">{order.order_number}</span>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-neutral-100 text-neutral-900 text-xs font-bold uppercase rounded-full">
                        {order.status}
                      </span>
                      <button
                        onClick={() => setInvoiceModalOrder(order)}
                        className="px-3 py-1 border border-neutral-300 rounded text-xs font-semibold hover:border-black flex items-center gap-1 transition-colors"
                      >
                        <Printer size={13} /> GST Tax Invoice
                      </button>
                    </div>
                  </div>

                  {/* Live Order Status Timeline */}
                  {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
                    <div className="py-2">
                      <div className="grid grid-cols-4 text-center text-[11px] font-bold uppercase mb-2">
                        <span className={currentStep >= 1 ? 'text-black' : 'text-neutral-400'}>1. Placed</span>
                        <span className={currentStep >= 2 ? 'text-black' : 'text-neutral-400'}>2. Packed</span>
                        <span className={currentStep >= 3 ? 'text-black' : 'text-neutral-400'}>3. Shipped</span>
                        <span className={currentStep >= 4 ? 'text-black' : 'text-neutral-400'}>4. Delivered</span>
                      </div>
                      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden flex">
                        <div
                          className="bg-black h-full transition-all duration-500"
                          style={{ width: `${(currentStep / 4) * 100}%` }}
                        />
                      </div>
                      {order.awb_tracking_number && (
                        <p className="text-[11px] text-neutral-600 mt-2 flex items-center gap-1.5">
                          <Truck size={13} /> {order.courier_name} AWB: <span className="font-mono font-bold">{order.awb_tracking_number}</span>
                          {order.tracking_url && (
                            <a
                              href={order.tracking_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-black font-bold underline ml-1 inline-flex items-center gap-0.5"
                            >
                              Track Live <ExternalLink size={10} />
                            </a>
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Itemized Garments */}
                  <div className="divide-y divide-neutral-100">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                        <div>
                          <h4 className="font-bold text-neutral-900">{item.title_snapshot}</h4>
                          <p className="text-[11px] text-neutral-500">
                            Size: {item.size_snapshot} | Color: {item.color_snapshot} | Qty: {item.quantity} | SKU: {item.sku_snapshot}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-black">{formatRupees(item.total_price_paise)}</span>
                          {(order.status === 'DELIVERED' || order.status === 'PAID' || order.status === 'SHIPPED') && (
                            <button
                              onClick={() => handleOpenRmaModal(order, item)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 underline"
                            >
                              Exchange Size / Return
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-neutral-100 text-xs">
                    <span className="text-neutral-500">Total Paid ({order.payment_method})</span>
                    <span className="text-sm font-black text-black">{formatRupees(order.total_paise)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Exchanges & Returns Tab */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          {rmaRequests.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 rounded border border-neutral-200">
              <RefreshCw size={32} className="mx-auto text-neutral-400 mb-2" />
              <h3 className="text-sm font-bold uppercase text-neutral-800">No Return or Exchange Requests</h3>
              <p className="text-xs text-neutral-500 mt-1">All RAMPRS garments come with a 7-day doorstep size exchange guarantee.</p>
            </div>
          ) : (
            rmaRequests.map((rma) => (
              <div key={rma.id} className="bg-white border border-neutral-200 rounded-lg p-5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wider text-black">
                    {rma.type === 'EXCHANGE' ? 'Size Exchange' : 'Item Return'} - Order #{rma.order?.order_number}
                  </span>
                  <span className="px-2.5 py-0.5 bg-neutral-100 font-bold uppercase rounded text-[11px]">
                    {rma.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-neutral-600">
                  <span className="font-semibold">Garment:</span> {rma.item?.title_snapshot} ({rma.item?.sku_snapshot})
                </p>
                {rma.requested_size && (
                  <p className="text-neutral-600">
                    <span className="font-semibold">Replacement Size:</span> {rma.requested_size}
                  </p>
                )}
                <p className="text-neutral-500">
                  <span className="font-semibold">Reason:</span> {rma.reason}
                </p>
                {rma.admin_notes && (
                  <div className="p-2.5 bg-neutral-50 rounded border border-neutral-200 text-neutral-700 mt-2">
                    <span className="font-semibold">Atelier Note:</span> {rma.admin_notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Wishlist Tab */}
      {activeTab === 'wishlist' && (
        <div className="space-y-4">
          {wishlist.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 rounded border border-neutral-200">
              <Heart size={32} className="mx-auto text-neutral-400 mb-2" />
              <h3 className="text-sm font-bold uppercase text-neutral-800">Your Wishlist is Empty</h3>
              <p className="text-xs text-neutral-500 mt-1">Tap the heart on any drop to save it to your private list.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {wishlist.map((p) => (
                <div key={p.id} className="border border-neutral-200 rounded p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-neutral-900">{p.title}</h4>
                    <p className="text-xs text-neutral-500 mt-1">{p.fit_type} FIT</p>
                  </div>
                  <button
                    onClick={() => router.push(`/products/${p.slug}`)}
                    className="mt-4 w-full py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded"
                  >
                    Select Size
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RMA Submission Modal */}
      {rmaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRmaModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-lg p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                Request Size Exchange or Return
              </h3>
              <button onClick={() => setRmaModalOpen(false)} className="text-neutral-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            {rmaMessage && (
              <div className="p-3 bg-neutral-100 rounded text-xs text-neutral-800 font-semibold">
                {rmaMessage}
              </div>
            )}

            <form onSubmit={handleSubmitRma} className="space-y-4 text-xs">
              <div>
                <p className="font-semibold text-neutral-700">Garment:</p>
                <p className="font-bold text-neutral-900">{selectedItem?.title_snapshot} ({selectedItem?.sku_snapshot})</p>
                <p className="text-neutral-500">Current Size: {selectedItem?.size_snapshot}</p>
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-700 mb-1">Request Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRmaType('EXCHANGE')}
                    className={`py-2 text-center font-bold rounded border ${
                      rmaType === 'EXCHANGE' ? 'bg-black text-white border-black' : 'border-neutral-300'
                    }`}
                  >
                    Size Exchange
                  </button>
                  <button
                    type="button"
                    onClick={() => setRmaType('RETURN')}
                    className={`py-2 text-center font-bold rounded border ${
                      rmaType === 'RETURN' ? 'bg-black text-white border-black' : 'border-neutral-300'
                    }`}
                  >
                    Full Return & Refund
                  </button>
                </div>
              </div>

              {rmaType === 'EXCHANGE' && (
                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">Select Replacement Size</label>
                  <div className="grid grid-cols-6 gap-2">
                    {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ClothingSize[]).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setRequestedSize(sz)}
                        className={`py-2 text-center font-bold rounded border ${
                          requestedSize === sz ? 'bg-black text-white border-black' : 'border-neutral-200 hover:border-black'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold uppercase text-neutral-700 mb-1">Reason for Request</label>
                <textarea
                  required
                  rows={3}
                  value={rmaReason}
                  onChange={(e) => setRmaReason(e.target.value)}
                  placeholder="e.g. Chest measurement is slightly loose, requesting size M for a sharper silhouette."
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRmaModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded font-bold uppercase text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rmaSubmitting}
                  className="px-6 py-2 bg-black text-white rounded font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400"
                >
                  {rmaSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable GST Tax Invoice Modal */}
      {invoiceModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setInvoiceModalOrder(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-lg p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
              <div>
                <h2 className="text-xl font-black tracking-luxury uppercase text-black">RAMPRS</h2>
                <span className="text-[10px] text-neutral-400 tracking-widest uppercase">Tax Invoice / Bill of Supply</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-black text-white text-xs font-bold uppercase rounded flex items-center gap-1.5"
                >
                  <Printer size={13} /> Print
                </button>
                <button onClick={() => setInvoiceModalOrder(null)} className="text-neutral-400 hover:text-black">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 text-xs gap-4 text-neutral-600">
              <div>
                <p className="font-bold text-neutral-900">Sold By:</p>
                <p>RAMPRS Apparel Pvt. Ltd.</p>
                <p>Plot 42, Textile Craft Park, Lower Parel</p>
                <p>Mumbai, Maharashtra - 400013</p>
                <p className="font-mono">GSTIN: 27AABCR0000A1Z5</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-neutral-900">Invoice Details:</p>
                <p className="font-mono font-bold text-black">#{invoiceModalOrder.order_number}</p>
                <p>Date: {new Date(invoiceModalOrder.created_at).toLocaleDateString('en-IN')}</p>
                <p>Payment: {invoiceModalOrder.payment_method}</p>
                <p>Status: {invoiceModalOrder.status}</p>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-3 text-xs">
              <p className="font-bold text-neutral-900 mb-1">Billed & Shipped To:</p>
              <p>{invoiceModalOrder.shipping_address.full_name}</p>
              <p>{invoiceModalOrder.shipping_address.line1}, {invoiceModalOrder.shipping_address.city}, {invoiceModalOrder.shipping_address.state} - {invoiceModalOrder.shipping_address.pincode}</p>
              <p>Phone: +91 {invoiceModalOrder.shipping_address.phone}</p>
            </div>

            <table className="w-full text-xs border border-neutral-200 divide-y divide-neutral-200">
              <thead className="bg-neutral-50 font-bold uppercase text-neutral-700">
                <tr>
                  <th className="p-2 text-left">Item Description</th>
                  <th className="p-2 text-left">SKU</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Unit Price</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {invoiceModalOrder.items?.map((it: any) => (
                  <tr key={it.id}>
                    <td className="p-2">{it.title_snapshot} (Size {it.size_snapshot})</td>
                    <td className="p-2 font-mono text-[10px]">{it.sku_snapshot}</td>
                    <td className="p-2 text-center">{it.quantity}</td>
                    <td className="p-2 text-right">{formatRupees(it.unit_price_paise)}</td>
                    <td className="p-2 text-right font-bold">{formatRupees(it.total_price_paise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 text-xs text-neutral-600 border-t border-neutral-200 pt-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupees(invoiceModalOrder.subtotal_paise)}</span>
              </div>
              {invoiceModalOrder.discount_paise > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span>-{formatRupees(invoiceModalOrder.discount_paise)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CGST (6%)</span>
                <span>{formatRupees(Math.round(invoiceModalOrder.gst_paise / 2))}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (6%)</span>
                <span>{formatRupees(Math.round(invoiceModalOrder.gst_paise / 2))}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{invoiceModalOrder.shipping_paise === 0 ? 'FREE' : formatRupees(invoiceModalOrder.shipping_paise)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-black border-t border-neutral-200 pt-2">
                <span>Total Amount Paid</span>
                <span>{formatRupees(invoiceModalOrder.total_paise)}</span>
              </div>
            </div>

            <p className="text-[10px] text-neutral-400 text-center border-t border-neutral-100 pt-3">
              This is a computer-generated tax invoice and does not require a physical signature.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

