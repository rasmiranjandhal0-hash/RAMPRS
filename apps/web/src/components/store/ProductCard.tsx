'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Product, formatRupees } from '@ramprs/shared';
import { useRamprsStore } from '@/lib/store/useRamprsStore';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { wishlist, toggleWishlist } = useRamprsStore();
  const isWishlisted = wishlist.some((p) => p.id === product.id);

  const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
  const imageUrl = defaultVariant?.images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600';
  const mrp = defaultVariant?.mrp_paise || 199900;
  const salePrice = defaultVariant?.sale_price_paise || 149900;
  const discountPercent = Math.round(((mrp - salePrice) / mrp) * 100);

  return (
    <div className="group flex flex-col relative bg-white">
      {/* Thumbnail Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 rounded-sm">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-black text-white text-[10px] font-extrabold uppercase px-2 py-0.5 tracking-wider">
            {discountPercent}% OFF
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full transition-colors ${
            isWishlisted ? 'bg-rose-50 text-rose-600' : 'bg-white/80 backdrop-blur-sm text-neutral-600 hover:text-black'
          }`}
          aria-label="Wishlist"
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Fit Badge */}
        <div className="absolute bottom-2 left-2">
          <span className="bg-white/90 backdrop-blur-sm text-neutral-800 text-[10px] font-semibold uppercase px-2 py-0.5 tracking-wider">
            {product.fit_type}
          </span>
        </div>
      </div>

      {/* Product Details */}
      <div className="pt-3 pb-2 flex flex-col flex-1">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-1">
            {product.title}
          </h3>
        </Link>

        {/* Colors available */}
        {product.variants && (
          <div className="flex items-center gap-1 mt-1.5">
            {Array.from(new Set(product.variants.map((v) => v.color_hex))).map((hex) => (
              <span
                key={hex}
                style={{ backgroundColor: hex }}
                className="w-2.5 h-2.5 rounded-full border border-neutral-300"
              />
            ))}
            <span className="text-[10px] text-neutral-400 ml-1">
              {product.variants.length} {product.variants.length === 1 ? 'size' : 'sizes'}
            </span>
          </div>
        )}

        {/* Price Row */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-sm font-black text-black">
            {formatRupees(salePrice)}
          </span>
          {mrp > salePrice && (
            <span className="text-xs text-neutral-400 line-through">
              {formatRupees(mrp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

