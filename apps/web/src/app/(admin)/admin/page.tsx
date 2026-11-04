import React from 'react';
import Link from 'next/link';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Truck,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatRupees } from '@ramprs/shared';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const supabase = createClient();

  // 1. Fetch Orders for KPIs
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_paise, status, created_at');

  const allOrders = orders || [];
  const paidOrders = allOrders.filter((o) => o.status !== 'CANCELLED');
  const totalRevenuePaise = paidOrders.reduce((sum, o) => sum + (o.total_paise || 0), 0);
  const aovPaise = paidOrders.length > 0 ? Math.round(totalRevenuePaise / paidOrders.length) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const ordersToday = allOrders.filter((o) => o.created_at.startsWith(todayStr)).length;
  const pendingShipments = allOrders.filter((o) => o.status === 'PAID' || o.status === 'PACKED').length;

  // 2. Fetch Open RMA Requests
  const { count: openRmaCount } = await supabase
    .from('rma_requests')
    .select('*', { count: 'exact', head: true })
    .in('status', ['PENDING', 'APPROVED', 'PICKUP_SCHEDULED']);

  // 3. Fetch Low Stock SKUs (stock_quantity <= 5)
  const { data: lowStockVariants } = await supabase
    .from('product_variants')
    .select(`
      id,
      sku,
      size,
      color_name,
      stock_quantity,
      mrp_paise,
      sale_price_paise,
      product:products(title, slug)
    `)
    .lte('stock_quantity', 5)
    .order('stock_quantity', { ascending: true })
    .limit(10);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">RAMPRS Executive Desk</span>
        <h1 className="text-3xl font-black uppercase tracking-luxury text-black mt-1">
          Operations & Performance Dashboard
        </h1>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <IndianRupee size={16} />
          </div>
          <p className="text-2xl font-black text-black mt-3">{formatRupees(totalRevenuePaise)}</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1">Live Confirmed GMV</span>
        </div>

        {/* Orders Today */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Orders Today</span>
            <ShoppingBag size={16} />
          </div>
          <p className="text-2xl font-black text-black mt-3">{ordersToday}</p>
          <span className="text-[11px] text-neutral-400 mt-1">Total {allOrders.length} all-time</span>
        </div>

        {/* AOV */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Average Order Value</span>
            <TrendingUp size={16} />
          </div>
          <p className="text-2xl font-black text-black mt-3">{formatRupees(aovPaise)}</p>
          <span className="text-[11px] text-neutral-400 mt-1">Across prepaid & COD</span>
        </div>

        {/* Pending Shipments */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Dispatch</span>
            <Truck size={16} />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-3">{pendingShipments}</p>
          <Link href="/admin/orders" className="text-[11px] text-black font-bold underline mt-1">
            Dispatch Queue →
          </Link>
        </div>

        {/* Open Exchanges & Returns */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Open RMAs</span>
            <RotateCcw size={16} />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-3">{openRmaCount || 0}</p>
          <Link href="/admin/returns" className="text-[11px] text-rose-600 font-bold underline mt-1">
            Review Requests →
          </Link>
        </div>
      </div>

      {/* Low-Stock SKU Alert Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle size={18} className="text-amber-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Critical Low-Stock SKU Alerts (Stock &le; 5 units)
            </h2>
          </div>
          <Link
            href="/admin/products"
            className="text-xs font-bold uppercase tracking-wider text-black hover:underline flex items-center gap-1"
          >
            Manage Matrix <ArrowRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs divide-y divide-neutral-200">
            <thead className="bg-neutral-50 font-bold uppercase text-neutral-600">
              <tr>
                <th className="px-6 py-3 text-left">SKU Snapshot</th>
                <th className="px-6 py-3 text-left">Product Title</th>
                <th className="px-6 py-3 text-center">Size</th>
                <th className="px-6 py-3 text-left">Color</th>
                <th className="px-6 py-3 text-right">Sale Price</th>
                <th className="px-6 py-3 text-center">Remaining Stock</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {lowStockVariants && lowStockVariants.length > 0 ? (
                lowStockVariants.map((v: any) => {
                  const product = Array.isArray(v.product) ? v.product[0] : v.product;
                  return (
                    <tr key={v.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-3 font-mono font-bold text-black">{v.sku}</td>
                      <td className="px-6 py-3 font-medium text-neutral-900">{product?.title || 'Unknown Garment'}</td>
                      <td className="px-6 py-3 text-center font-bold">{v.size}</td>
                      <td className="px-6 py-3">{v.color_name}</td>
                      <td className="px-6 py-3 text-right font-medium">{formatRupees(v.sale_price_paise)}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${v.stock_quantity === 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                          }`}>
                          {v.stock_quantity} left
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          href={`/admin/products`}
                          className="text-xs font-bold text-black underline hover:text-neutral-600"
                        >
                          Restock SKU
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-neutral-400">
                    All product variants have healthy inventory levels (&gt; 5 units).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

