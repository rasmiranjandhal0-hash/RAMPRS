import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/store/ProductCard';
import { Product } from '@ramprs/shared';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function HomePage() {
  const supabase = createClient();

  // 1. Fetch CMS Settings
  const { data: cms } = await supabase
    .from('cms_settings')
    .select('*')
    .single();

  // 2. Fetch Featured Products with Variants
  const { data: featuredProducts } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*)
    `)
    .eq('is_featured', true)
    .eq('is_active', true)
    .limit(8);

  // 3. Fetch Top Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .limit(4);

  const heroTitle = cms?.hero_title || 'AUTUMN / WINTER 2026 DROP';
  const heroSubtitle = cms?.hero_subtitle || 'Heavyweight Streetwear, Tailored Denim & Pure Festive Linens. Designed in India.';
  const heroImage = cms?.hero_image_url || 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2076&auto=format&fit=crop';
  const heroCtaLink = cms?.hero_cta_link || '/shop';

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[580px] w-full flex items-center justify-center bg-black overflow-hidden">
        <Image
          src={heroImage}
          alt="RAMPRS Campaign"
          fill
          priority
          className="object-cover object-center opacity-65 scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold tracking-luxury uppercase">
            <Sparkles size={14} className="text-amber-400" />
            New Season Arrival
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-luxury uppercase leading-tight drop-shadow-md">
            {heroTitle}
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-neutral-200 font-normal leading-relaxed">
            {heroSubtitle}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={heroCtaLink}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-luxury hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
            >
              Explore Collection <ArrowRight size={14} />
            </Link>
            <Link
              href="/collections/oversized-tees"
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white text-white text-xs font-bold uppercase tracking-luxury hover:bg-white/10 transition-all text-center"
            >
              Oversized Fits
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-neutral-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Atelier Archives</span>
            <h2 className="text-2xl font-black uppercase tracking-luxury text-black mt-1">Shop by Collection</h2>
          </div>
          <Link href="/shop" className="text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-neutral-500 mt-2 sm:mt-0 flex items-center gap-1">
            View All Drops <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories && categories.length > 0 ? (
            categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/collections/${cat.slug}`}
                className="group relative h-96 overflow-hidden rounded-sm bg-neutral-900 block"
              >
                <Image
                  src={cat.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800'}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-lg font-black uppercase tracking-wider text-white">
                    {cat.name}
                  </h3>
                  <span className="text-xs font-semibold text-neutral-300 group-hover:text-white flex items-center gap-1 mt-1 transition-colors">
                    Explore Drop <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-4 text-center py-8 text-neutral-400">No categories found.</div>
          )}
        </div>
      </section>

      {/* Trending Fits Carousel / Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-neutral-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600">Trending Now</span>
            <h2 className="text-2xl font-black uppercase tracking-luxury text-black mt-1">Signature Silhouettes</h2>
          </div>
          <p className="text-xs text-neutral-500 max-w-sm mt-2 sm:mt-0">
            Crafted with high-thread density, reinforced neck ribs, and tailored fit profiles.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
          {featuredProducts && featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product as Product} />
            ))
          ) : (
            <div className="col-span-4 text-center py-12 text-neutral-500 font-medium">
              Featured products are landing soon.
            </div>
          )}
        </div>
      </section>

      {/* Brand Craftsmanship Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-950 text-white rounded-lg p-8 sm:p-14 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold tracking-luxury uppercase text-amber-400">The RAMPRS Standard</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-wider leading-tight">
              Crafted in India.<br />Engineered for Longevity.
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Every RAMPRS garment undergoes rigorous pre-shrinking, color-fastness stress testing, and double-needle lock stitching. From 240 GSM single jersey cottons to Japanese-loomed selvedge denim, we never compromise on textile density.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors"
              >
                Discover The Materials <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="relative h-80 rounded-sm overflow-hidden bg-neutral-800">
            <Image
              src="https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1200&auto=format&fit=crop"
              alt="RAMPRS Denim Detail"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

