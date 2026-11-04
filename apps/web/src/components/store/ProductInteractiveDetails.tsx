'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Ruler, ShoppingBag, Heart, ShieldCheck, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Product, ProductVariant, ClothingSize, formatRupees } from '@ramprs/shared';
import { useRamprsStore } from '@/lib/store/useRamprsStore';
import { SizeGuideModal } from './SizeGuideModal';

interface ProductInteractiveDetailsProps {
  product: Product;
}

export const ProductInteractiveDetails: React.FC<ProductInteractiveDetailsProps> = ({ product }) => {
  const { addToCart, wishlist, toggleWishlist } = useRamprsStore();
  const isWishlisted = wishlist.some((p) => p.id === product.id);

  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    variants[0] || ({} as ProductVariant)
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isFabricCareOpen, setIsFabricCareOpen] = useState(true);
  const [isShippingOpen, setIsShippingOpen] = useState(false);

  // Group variants by color
  const colors = Array.from(
    new Map(variants.map((v) => [v.color_name, { name: v.color_name, hex: v.color_hex }])).values()
  );

  // Filter sizes available for current color
  const sizesForColor = variants.filter((v) => v.color_name === selectedVariant.color_name);

  const handleColorChange = (colorName: string) => {
    const matched = variants.find((v) => v.color_name === colorName && v.size === selectedVariant.size)
      || variants.find((v) => v.color_name === colorName);
    if (matched) {
      setSelectedVariant(matched);
      setSelectedImageIndex(0);
    }
  };

  const handleSizeChange = (size: ClothingSize) => {
    const matched = variants.find((v) => v.color_name === selectedVariant.color_name && v.size === size);
    if (matched) {
      setSelectedVariant(matched);
    }
  };

  const images = selectedVariant.images && selectedVariant.images.length > 0
    ? selectedVariant.images
    : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200'];

  const isOutOfStock = !selectedVariant.stock_quantity || selectedVariant.stock_quantity <= 0;
  const isLowStock = selectedVariant.stock_quantity > 0 && selectedVariant.stock_quantity <= 3;

  const mrp = selectedVariant.mrp_paise || 199900;
  const salePrice = selectedVariant.sale_price_paise || 149900;
  const discountPercent = Math.round(((mrp - salePrice) / mrp) * 100);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Multi-angle Zoomable Gallery (7 cols) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[640px] flex-shrink-0">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-28 rounded-sm overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImageIndex === idx ? 'border-black' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`${product.title} view ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Stage Image */}
          <div className="relative flex-1 aspect-[3/4] bg-neutral-100 rounded-sm overflow-hidden group">
            <Image
              src={images[selectedImageIndex] || images[0]}
              alt={product.title}
              fill
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-black text-white text-xs font-black uppercase px-2.5 py-1 tracking-wider">
                {discountPercent}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Product Info & Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-neutral-100 text-neutral-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                {product.fit_type} FIT
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                SKU: {selectedVariant.sku || 'RAMPRS-SKU'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-luxury text-black">
              {product.title}
            </h1>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-2xl font-black text-black">
                {formatRupees(salePrice)}
              </span>
              {mrp > salePrice && (
                <span className="text-base text-neutral-400 line-through">
                  {formatRupees(mrp)}
                </span>
              )}
              <span className="text-xs text-neutral-500 font-medium">
                (Inclusive of all taxes)
              </span>
            </div>
          </div>

          <hr className="border-neutral-200" />

          {/* Color Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Color: <span className="font-normal text-neutral-600">{selectedVariant.color_name}</span>
              </label>
            </div>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleColorChange(c.name)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    selectedVariant.color_name === c.name ? 'border-black scale-110 shadow-sm' : 'border-neutral-300 hover:scale-105'
                  }`}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          {/* Size Selector + Size Guide Trigger */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Size: <span className="font-normal text-neutral-600">{selectedVariant.size}</span>
              </label>
              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-xs font-bold text-neutral-900 underline flex items-center gap-1 hover:text-neutral-500 transition-colors"
              >
                <Ruler size={13} /> Size Guide
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ClothingSize[]).map((size) => {
                const variantForSize = sizesForColor.find((v) => v.size === size);
                const isAvailable = variantForSize && variantForSize.stock_quantity > 0;
                const isSelected = selectedVariant.size === size;

                return (
                  <button
                    key={size}
                    disabled={!isAvailable}
                    onClick={() => handleSizeChange(size)}
                    className={`py-3 text-xs font-bold rounded-sm border transition-all ${
                      isSelected
                        ? 'bg-black text-white border-black shadow'
                        : isAvailable
                        ? 'bg-white text-neutral-900 border-neutral-300 hover:border-black'
                        : 'bg-neutral-100 text-neutral-300 border-neutral-200 cursor-not-allowed line-through'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            {/* Live Inventory Badge */}
            <div className="mt-3">
              {isOutOfStock ? (
                <span className="text-xs font-bold text-rose-600 uppercase">
                  Currently Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                  ⚠️ Only {selectedVariant.stock_quantity} left in stock - order soon!
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  ● In Stock - Ready to Dispatch
                </span>
              )}
            </div>
          </div>

          {/* Add to Bag and Wishlist Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              disabled={isOutOfStock}
              onClick={() => addToCart(product, selectedVariant, 1)}
              className="flex-1 py-4 bg-black text-white text-xs font-bold uppercase tracking-luxury hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors rounded-sm flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
            </button>

            <button
              onClick={() => toggleWishlist(product)}
              className={`p-4 rounded-sm border transition-colors ${
                isWishlisted
                  ? 'border-rose-600 bg-rose-50 text-rose-600'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:border-black'
              }`}
              aria-label="Wishlist"
            >
              <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-200 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <RefreshCw size={15} className="text-neutral-900" />
              <span>7-Day Doorstep Size Exchange</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-neutral-900" />
              <span>100% Cotton & Heavyweight Knits</span>
            </div>
          </div>

          {/* Accordion: Fabric & Wash Care */}
          <div className="border-t border-neutral-200 pt-4 space-y-3">
            <button
              onClick={() => setIsFabricCareOpen(!isFabricCareOpen)}
              className="w-full flex justify-between items-center text-xs font-bold uppercase tracking-wider text-neutral-900"
            >
              <span>Fabric Composition & Care</span>
              {isFabricCareOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {isFabricCareOpen && (
              <p className="text-xs text-neutral-600 leading-relaxed pl-1 animate-in fade-in duration-200">
                {product.fabric_care}
              </p>
            )}

            <button
              onClick={() => setIsShippingOpen(!isShippingOpen)}
              className="w-full flex justify-between items-center text-xs font-bold uppercase tracking-wider text-neutral-900 pt-2 border-t border-neutral-100"
            >
              <span>Shipping & Delivery Policy</span>
              {isShippingOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {isShippingOpen && (
              <p className="text-xs text-neutral-600 leading-relaxed pl-1 animate-in fade-in duration-200">
                Dispatches within 24 business hours from our Mumbai atelier. Delivery takes 2-4 business days across metro cities (Delhi, Mumbai, Bengaluru, Hyderabad, Chennai) and 4-6 business days for the rest of India.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        sizeChart={product.size_chart_json}
        productTitle={product.title}
      />
    </>
  );
};

