'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle, XCircle, Clock, Truck, IndianRupee } from 'lucide-react';
import { RmaStatus } from '@ramprs/shared';
import { createClient } from '@/lib/supabase/client';

interface AdminReturnsClientProps {
  initialRmaList: any[];
}

export const AdminReturnsClient: React.FC<AdminReturnsClientProps> = ({ initialRmaList }) => {
  const router = useRouter();
  const supabase = createClient();

  const [rmaList, setRmaList] = useState(initialRmaList);
  const [selectedRma, setSelectedRma] = useState<any>(null);
  const [resolutionStatus, setResolutionStatus] = useState<RmaStatus>('APPROVED');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleOpenResolve = (rma: any) => {
    setSelectedRma(rma);
    setResolutionStatus(rma.status === 'PENDING' ? 'APPROVED' : 'COMPLETED');
    setAdminNotes(rma.admin_notes || '');
    setMessage('');
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRma) return;

    try {
      setSubmitting(true);
      setMessage('');

      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const res = await fetch(`${apiUrl}/api/admin/rma/${selectedRma.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          status: resolutionStatus,
          admin_notes: adminNotes,
          exchange_variant_id: selectedRma.item?.variant_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resolve RMA');
      }

      setMessage(`Request marked as ${resolutionStatus}! Customer informed.`);
      setRmaList(
        rmaList.map((r) =>
          r.id === selectedRma.id ? { ...r, status: resolutionStatus, admin_notes: adminNotes } : r
        )
      );

      setTimeout(() => {
        setSelectedRma(null);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-neutral-200">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Atelier Concierge</span>
        <h1 className="text-2xl font-black uppercase tracking-luxury text-black mt-1">
          RMA Exchanges & Returns Desk
        </h1>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs divide-y divide-neutral-200">
            <thead className="bg-neutral-50 font-bold uppercase text-neutral-600">
              <tr>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Order #</th>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-left">Garment SKU</th>
                <th className="p-4 text-center">Req. Size</th>
                <th className="p-4 text-left">Customer Reason</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {rmaList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-400">
                    No open return or exchange requests currently pending review.
                  </td>
                </tr>
              ) : (
                rmaList.map((rma) => (
                  <tr key={rma.id} className="hover:bg-neutral-50">
                    <td className="p-4 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        rma.type === 'EXCHANGE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {rma.type}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-black">{rma.order?.order_number}</td>
                    <td className="p-4 text-neutral-700">{rma.user?.full_name || 'Customer'}</td>
                    <td className="p-4">
                      <p className="font-bold text-black">{rma.item?.title_snapshot}</p>
                      <p className="font-mono text-[10px] text-neutral-400">{rma.item?.sku_snapshot}</p>
                    </td>
                    <td className="p-4 text-center font-bold text-black">{rma.requested_size || '-'}</td>
                    <td className="p-4 text-neutral-600 max-w-xs truncate" title={rma.reason}>
                      {rma.reason}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-neutral-100">
                        {rma.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenResolve(rma)}
                        className="px-3 py-1 bg-black text-white rounded font-bold uppercase text-[11px] hover:bg-neutral-800"
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Modal */}
      {selectedRma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRma(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-lg p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black pb-2 border-b border-neutral-200">
              Resolve {selectedRma.type} Request - Order #{selectedRma.order?.order_number}
            </h3>

            {message && (
              <div className="p-3 bg-neutral-100 rounded text-xs font-bold text-black">{message}</div>
            )}

            <form onSubmit={handleResolve} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-neutral-700 mb-1">Set Resolution Status</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as RmaStatus)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded font-bold"
                >
                  <option value="APPROVED">APPROVED (Schedule Courier Pickup)</option>
                  <option value="PICKUP_SCHEDULED">PICKUP SCHEDULED</option>
                  <option value="COMPLETED">COMPLETED (Replacement Dispatched or Refund Settled)</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-700 mb-1">Atelier Concierge Notes</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Size L confirmed in stock; return pickup scheduled for tomorrow."
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRma(null)}
                  className="px-4 py-2 border border-neutral-300 rounded font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-black text-white rounded font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400"
                >
                  {submitting ? 'Updating...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

