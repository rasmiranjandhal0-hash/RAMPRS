'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, Search, User, Menu, X } from 'lucide-react';
import { useRamprsStore } from '@/lib/store/useRamprsStore';

interface NavbarProps {
  categories?: Array<{ id: string; name: string; slug: string }>;
}

export const Navbar: React.FC<NavbarProps> = ({ categories = [] }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cart, wishlist, openCartDrawer } = useRamprsStore();

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalWishlistItems = wishlist.length;

  const defaultCategories = [
    { name: 'Men', slug: 'men' },
    { name: 'Women', slug: 'women' },
    { name: 'Oversized Tees', slug: 'oversized-tees' },
    { name: 'Cargo & Denim', slug: 'cargo-denim' },
    { name: 'Festive Linen', slug: 'festive-linen' },
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-neutral-900 p-2 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex items-center">
            <Link href="/" className="group flex flex-col items-center">
              <span className="text-2xl font-black tracking-luxury text-black group-hover:opacity-80 transition-opacity">
                RAMPRS
              </span>
              <span className="text-[9px] tracking-widest text-neutral-500 font-medium uppercase -mt-1">
                Atelier
              </span>
            </Link>
          </div>

          {/* Desktop Mega-menu links */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="/shop"
              className="text-sm font-semibold tracking-wider uppercase text-neutral-900 hover:text-black border-b-2 border-transparent hover:border-black py-1 transition-all"
            >
              All Drops
            </Link>
            {displayCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/collections/${cat.slug}`}
                className="text-sm font-medium tracking-wider uppercase text-neutral-600 hover:text-black border-b-2 border-transparent hover:border-black py-1 transition-all"
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Icons: Search, Wishlist, Account, Cart */}
          <div className="flex items-center gap-5">
            <Link
              href="/shop"
              className="text-neutral-700 hover:text-black transition-colors"
              aria-label="Search Catalog"
            >
              <Search size={20} />
            </Link>

            <Link
              href="/account"
              className="text-neutral-700 hover:text-black transition-colors"
              aria-label="Account"
            >
              <User size={20} />
            </Link>

            <Link
              href="/account?tab=wishlist"
              className="relative text-neutral-700 hover:text-black transition-colors"
              aria-label="Wishlist"
            >
              <Heart size={20} />
              {totalWishlistItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalWishlistItems}
                </span>
              )}
            </Link>

            <button
              onClick={openCartDrawer}
              className="relative text-neutral-700 hover:text-black transition-colors flex items-center gap-1.5 p-1"
              aria-label="Open Shopping Bag"
            >
              <ShoppingBag size={20} />
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-neutral-200 px-6 py-6 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-4">
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-bold tracking-wider uppercase text-neutral-900"
            >
              All Drops
            </Link>
            {displayCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/collections/${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium tracking-wider uppercase text-neutral-700"
              >
                {cat.name}
              </Link>
            ))}
            <hr className="my-2 border-neutral-200" />
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-neutral-700 flex items-center gap-2"
            >
              <User size={16} /> My Account & Orders
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-neutral-400 font-mono"
            >
              Staff Admin Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

