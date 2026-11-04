'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Package,
  Search,
  Filter,
  Printer,
  ExternalLink,
  CheckCircle,
  X,
  Send,
} from 'lucide-react';
import { OrderStatus, formatRupees } from '@ramprs/shared';
import { createClient } from '@/lib/supabase/client';

interface AdminOrdersClientProps {
  initialOrders: any[];
}

export const AdminOrdersClient: React.FC<AdminOrdersClientProps> = ({ initialOrders }) => {
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Dispatch / Fulfill Modal
  const [dispatchModalOrder, setDispatchModalOrder] = useState<any>(null);
  const [targetStatus, setTargetStatus] = useState<OrderStatus>('SHIPPED');
  const [courierName, setCourierName] = useState('Delhivery Express');
  const [awbNumber, setAwbNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [fulfillMessage, setFulfillMessage] = useState('');

  // Bulk Print Packing Slip
  const [printSlipOrder, setPrintSlipOrder] = useState<any>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shipping_address?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shipping_address?.phone?.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const handleOpenDispatch = (order: any) => {
    setDispatchModalOrder(order);
    setTargetStatus(order.status === 'PAID' ? 'PACKED' : 'SHIPPED');
    setCourierName('Delhivery Express');
    const genAwb = `DEL-${Date.now().toString().slice(-8)}`;
    setAwbNumber(genAwb);
    setTrackingUrl(`https://track.delhivery.com/?awb=${genAwb}`);
    setFulfillMessage('');
  };

  const handleConfirmFulfill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchModalOrder) return;

    try {
      setIsFulfilling(true);
      setFulfillMessage('');

      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const res = await fetch(`${apiUrl}/api/admin/orders/${dispatchModalOrder.id}/fulfill`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          status: targetStatus,
          courier_name: targetStatus === 'SHIPPED' ? courierName : undefined,
          awb_tracking_number: targetStatus === 'SHIPPED' ? awbNumber : undefined,
          tracking_url: targetStatus === 'SHIPPED' ? trackingUrl : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order fulfillment');
      }

      setFulfillMessage(`Order #${dispatchModalOrder.order_number} marked as ${targetStatus}! Email triggered.`);
      // Update local state
      setOrders(
        orders.map((o) =>
          o.id === dispatchModalOrder.id
            ? {
                ...o,
                status: targetStatus,
                courier_name: courierName,
                awb_tracking_number: awbNumber,
                tracking_url: trackingUrl,
              }
            : o
        )
      );

      setTimeout(() => {
        setDispatchModalOrder(null);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setFulfillMessage(`Error: ${err.message}`);
    } finally {
      setIsFulfilling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-neutral-200 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Order Management System</span>
          <h1 className="text-2xl font-black uppercase tracking-luxury text-black mt-1">
            Dispatch & Fulfillment Desk
          </h1>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-lg border border-neutral-200 text-xs">
        <div className="flex items-center gap-2 flex-1">
          <Search size={16} className="text-neutral-400" />
          <input
            type="text"
            placeholder="Search Order Number, Customer Name, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-2 py-1.5 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-neutral-300 rounded font-bold uppercase text-neutral-800"
          >
            <option value="ALL">All Statuses ({orders.length})</option>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="PACKED">PACKED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="RETURN_REQUESTED">RETURN REQUESTED</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs divide-y divide-neutral-200">
            <thead className="bg-neutral-50 font-bold uppercase text-neutral-600">
              <tr>
                <th className="p-4 text-left">Order #</th>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-left">City & State</th>
                <th className="p-4 text-left">Items</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">
                    No orders match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <td className="p-4 font-mono font-bold text-black">{order.order_number}</td>
                    <td className="p-4">
                      <p className="font-bold text-neutral-900">{order.shipping_address?.full_name}</p>
                      <p className="text-[11px] text-neutral-400">{order.shipping_address?.phone}</p>
                    </td>
                    <td className="p-4 text-neutral-600">
                      {order.shipping_address?.city}, {order.shipping_address?.state}
                    </td>
                    <td className="p-4">
                      {order.items?.map((it: any) => (
                        <div key={it.id} className="text-[11px] text-neutral-700">
                          {it.quantity}x {it.title_snapshot} ({it.size_snapshot})
                        </div>
                      ))}
                    </td>
                    <td className="p-4 text-right font-black text-black">
                      {formatRupees(order.total_paise)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        order.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'SHIPPED'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'PACKED'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status === 'RETURN_REQUESTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setPrintSlipOrder(order)}
                        className="px-2.5 py-1 border border-neutral-300 rounded font-semibold text-neutral-700 hover:border-black"
                        title="Print Packing Slip"
                      >
                        <Printer size={12} className="inline mr-1" /> Slip
                      </button>

                      <button
                        onClick={() => handleOpenDispatch(order)}
                        className="px-3 py-1 bg-black text-white font-bold uppercase rounded text-[11px] hover:bg-neutral-800"
                      >
                        <Truck size={12} className="inline mr-1" /> Dispatch
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch & AWB Modal */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDispatchModalOrder(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-lg p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
                <Truck size={16} /> Fulfill Order #{dispatchModalOrder.order_number}
              </h3>
              <button onClick={() => setDispatchModalOrder(null)} className="text-neutral-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            {fulfillMessage && (
              <div className="p-3 bg-neutral-100 border border-neutral-300 rounded text-xs font-bold text-black">
                {fulfillMessage}
              </div>
            )}

            <form onSubmit={handleConfirmFulfill} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-neutral-700 mb-1">Target Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded font-bold"
                >
                  <option value="PACKED">PACKED (In Atelier Queue)</option>
                  <option value="SHIPPED">SHIPPED (With Courier & AWB)</option>
                  <option value="DELIVERED">DELIVERED (Doorstep Confirmed)</option>
                </select>
              </div>

              {targetStatus === 'SHIPPED' && (
                <>
                  <div>
                    <label className="block font-bold uppercase text-neutral-700 mb-1">Courier Partner</label>
                    <select
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded"
                    >
                      <option value="Delhivery Express">Delhivery Express</option>
                      <option value="BlueDart Air">BlueDart Air</option>
                      <option value="DTDC Priority">DTDC Priority</option>
                      <option value="Shadowfax Local">Shadowfax Local</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-neutral-700 mb-1">AWB Tracking Number</label>
                    <input
                      type="text"
                      required
                      value={awbNumber}
                      onChange={(e) => setAwbNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-neutral-700 mb-1">Tracking URL</label>
                    <input
                      type="url"
                      required
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded"
                    />
                  </div>
                </>
              )}

              <div className="p-3 bg-neutral-50 rounded text-neutral-600">
                <p>
                  Marking as <span className="font-bold text-black">{targetStatus}</span> will instantly update the customer's account portal and send a branded email notification via Resend.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalOrder(null)}
                  className="px-4 py-2 border border-neutral-300 rounded font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFulfilling}
                  className="px-6 py-2 bg-black text-white rounded font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400"
                >
                  {isFulfilling ? 'Updating...' : 'Update & Send Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Packing Slip Modal */}
      {printSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPrintSlipOrder(null)} />
          <div className="relative w-full max-w-xl bg-white rounded-lg p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
              <div>
                <span className="text-xl font-black tracking-luxury uppercase text-black">RAMPRS</span>
                <span className="block text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
                  Atelier Fulfillment Packing Slip
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-black text-white text-xs font-bold uppercase rounded flex items-center gap-1.5"
                >
                  <Printer size={13} /> Print Slip
                </button>
                <button onClick={() => setPrintSlipOrder(null)} className="text-neutral-400 hover:text-black">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 text-xs text-neutral-700">
              <div>
                <p className="font-bold text-neutral-900">Ship To:</p>
                <p className="font-bold">{printSlipOrder.shipping_address?.full_name}</p>
                <p>{printSlipOrder.shipping_address?.line1}</p>
                <p>{printSlipOrder.shipping_address?.city}, {printSlipOrder.shipping_address?.state} - {printSlipOrder.shipping_address?.pincode}</p>
                <p>Phone: +91 {printSlipOrder.shipping_address?.phone}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-neutral-900">Order Ref:</p>
                <p className="font-mono font-bold text-black">{printSlipOrder.order_number}</p>
                <p>Payment: {printSlipOrder.payment_method}</p>
                <p>Date: {new Date(printSlipOrder.created_at).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            <table className="w-full text-xs border border-neutral-200 divide-y divide-neutral-200">
              <thead className="bg-neutral-50 font-bold uppercase text-neutral-700">
                <tr>
                  <th className="p-2 text-left">SKU</th>
                  <th className="p-2 text-left">Garment Title</th>
                  <th className="p-2 text-center">Size</th>
                  <th className="p-2 text-center">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {printSlipOrder.items?.map((it: any) => (
                  <tr key={it.id}>
                    <td className="p-2 font-mono font-bold">{it.sku_snapshot}</td>
                    <td className="p-2">{it.title_snapshot}</td>
                    <td className="p-2 text-center font-bold">{it.size_snapshot}</td>
                    <td className="p-2 text-center font-bold">{it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-3 bg-neutral-50 rounded border border-neutral-200 text-[11px] text-neutral-600">
              <p className="font-bold text-black">Packer Checklist:</p>
              <p>✔ Original RAMPRS luxury hangtag attached</p>
              <p>✔ Protective cotton garment bag included</p>
              <p>✔ Extra collar stays & spare buttons included</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

