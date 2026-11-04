import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Shirt,
  ShoppingBag,
  RotateCcw,
  Tag,
  Palette,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-luxury text-white">RAMPRS</span>
              <span className="px-1.5 py-0.5 bg-rose-600 text-[10px] font-extrabold uppercase rounded">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Omni-Channel Operations Desk</p>
          </div>

          <nav className="space-y-1 text-xs font-bold uppercase tracking-wider">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              <ShoppingBag size={16} /> Orders (OMS)
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              <Shirt size={16} /> Products & SKUs
            </Link>
            <Link
              href="/admin/returns"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              <RotateCcw size={16} /> Returns & Exchanges
            </Link>
            <Link
              href="/admin/coupons"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              <Tag size={16} /> Coupons & Promos
            </Link>
            <Link
              href="/admin/cms"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              <Palette size={16} /> Storefront CMS
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-neutral-800 text-xs text-neutral-400 space-y-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back to Live Store
          </Link>
          <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
            <ShieldAlert size={12} className="text-emerald-500" />
            <span>Encrypted Session (2FA)</span>
          </div>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

