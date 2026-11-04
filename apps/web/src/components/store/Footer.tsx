import React from 'react';
import Link from 'next/link';
import { ShieldCheck, RefreshCw, Truck, CreditCard } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-950 text-white pt-16 pb-12 border-t border-neutral-900">
      {/* Brand Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-neutral-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <Truck className="w-6 h-6 text-neutral-400 mb-2" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Free Express Delivery</h4>
            <p className="text-[11px] text-neutral-400 mt-1">On all orders across India above ₹999</p>
          </div>
          <div className="flex flex-col items-center">
            <RefreshCw className="w-6 h-6 text-neutral-400 mb-2" />
            <h4 className="text-xs font-bold uppercase tracking-wider">7-Day Size Exchange</h4>
            <p className="text-[11px] text-neutral-400 mt-1">Hassle-free doorstep pickup & replacement</p>
          </div>
          <div className="flex flex-col items-center">
            <CreditCard className="w-6 h-6 text-neutral-400 mb-2" />
            <h4 className="text-xs font-bold uppercase tracking-wider">UPI, Cards & NetBanking</h4>
            <p className="text-[11px] text-neutral-400 mt-1">Zero transaction fees & instant verification</p>
          </div>
          <div className="flex flex-col items-center">
            <ShieldCheck className="w-6 h-6 text-neutral-400 mb-2" />
            <h4 className="text-xs font-bold uppercase tracking-wider">100% Authentic Indian Craft</h4>
            <p className="text-[11px] text-neutral-400 mt-1">240+ GSM heavyweight fabrics & bespoke cuts</p>
          </div>
        </div>
      </div>

      {/* Main Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <span className="text-2xl font-black tracking-luxury text-white">RAMPRS</span>
          <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
            Contemporary luxury streetwear crafted in India. Combining high-density textiles, dropped shoulder profiles, and tailored silhouettes.
          </p>
        </div>

        <div>
          <h5 className="text-xs font-bold uppercase tracking-widest text-neutral-300 mb-4">Shop Collections</h5>
          <ul className="space-y-2 text-xs text-neutral-400">
            <li><Link href="/collections/oversized-tees" className="hover:text-white transition-colors">Oversized T-Shirts</Link></li>
            <li><Link href="/collections/cargo-denim" className="hover:text-white transition-colors">Tactical Cargo & Denim</Link></li>
            <li><Link href="/collections/festive-linen" className="hover:text-white transition-colors">Festive Linen Drops</Link></li>
            <li><Link href="/shop" className="hover:text-white transition-colors">All New Releases</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-bold uppercase tracking-widest text-neutral-300 mb-4">Customer Care</h5>
          <ul className="space-y-2 text-xs text-neutral-400">
            <li><Link href="/account" className="hover:text-white transition-colors">Track Order Status</Link></li>
            <li><Link href="/account" className="hover:text-white transition-colors">Exchange Size or Return</Link></li>
            <li><span className="hover:text-white cursor-pointer">Size Guide & Care Tips</span></li>
            <li><span className="hover:text-white cursor-pointer">Contact Concierge</span></li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-bold uppercase tracking-widest text-neutral-300 mb-4">Join The Atelier</h5>
          <p className="text-xs text-neutral-400 mb-3">
            Subscribe for secret limited drop alerts, lookbook previews, and private sales.
          </p>
          <div className="flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-white rounded-l focus:outline-none focus:border-white flex-1"
            />
            <button className="bg-white text-black px-4 py-2 text-xs font-bold uppercase rounded-r hover:bg-neutral-200 transition-colors">
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center text-[11px] text-neutral-500 gap-4">
        <p>© 2026 RAMPRS Apparel Pvt. Ltd. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/admin" className="text-neutral-600 hover:text-neutral-400 font-mono">
            Admin Console
          </Link>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>GSTIN: 27AABCR0000A1Z5</span>
        </div>
      </div>
    </footer>
  );
};

