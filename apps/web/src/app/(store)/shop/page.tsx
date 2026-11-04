import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/store/ProductCard';
import { Product } from '@ramprs/shared';
import { Filter, SlidersHorizontal } from 'lucide-react';

interface ShopPageProps {
  searchParams: {
    category?: string;
    size?: string;
    fit?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

export const revalidate = 30;

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const supabase = createClient();

  // Query categories for filter sidebar
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true);

  // Build product query
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*)
    `)
    .eq('is_active', true);

  // Filter by category slug if provided
  if (searchParams.category) {
    const matchedCategory = categories?.find((c) => c.slug === searchParams.category);
    if (matchedCategory) {
      query = query.eq('category_id', matchedCategory.id);
    }
  }

  // Filter by fit type
  if (searchParams.fit) {
    query = query.eq('fit_type', searchParams.fit);
  }

  const { data: rawProducts, error } = await query;

  if (error) {
    console.error('Error loading catalog products:', error);
  }

  let products = (rawProducts as Product[]) || [];

  // In-memory filter for variant-level attributes like size
  if (searchParams.size) {
    products = products.filter((p) =>
      p.variants?.some((v) => v.size === searchParams.size)
    );
  }

  // Sorting
  if (searchParams.sort === 'price-low') {
    products.sort((a, b) => {
      const pA = a.variants?.[0]?.sale_price_paise || 0;
      const pB = b.variants?.[0]?.sale_price_paise || 0;
      return pA - pB;
    });
  } else if (searchParams.sort === 'price-high') {
    products.sort((a, b) => {
      const pA = a.variants?.[0]?.sale_price_paise || 0;
      const pB = b.variants?.[0]?.sale_price_paise || 0;
      return pB - pA;
    });
  } else {
    // Default newest
    products.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  }

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const fits = ['SLIM', 'REGULAR', 'OVERSIZED', 'RELAXED'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="pb-6 mb-8 border-b border-neutral-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Atelier Catalog</span>
          <h1 className="text-3xl font-black uppercase tracking-luxury text-black mt-1">
            {searchParams.category ? searchParams.category.replace('-', ' ') : 'All Collections'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Showing {products.length} {products.length === 1 ? 'silhouette' : 'silhouettes'}
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase text-neutral-500">Sort By:</span>
          <div className="flex gap-2 text-xs">
            <Link
              href={{ query: { ...searchParams, sort: 'newest' } }}
              className={`px-3 py-1.5 rounded border ${
                !searchParams.sort || searchParams.sort === 'newest'
                  ? 'bg-black text-white border-black font-bold'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
              }`}
            >
              Newest
            </Link>
            <Link
              href={{ query: { ...searchParams, sort: 'price-low' } }}
              className={`px-3 py-1.5 rounded border ${
                searchParams.sort === 'price-low'
                  ? 'bg-black text-white border-black font-bold'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
              }`}
            >
              Price: Low to High
            </Link>
            <Link
              href={{ query: { ...searchParams, sort: 'price-high' } }}
              className={`px-3 py-1.5 rounded border ${
                searchParams.sort === 'price-high'
                  ? 'bg-black text-white border-black font-bold'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
              }`}
            >
              Price: High to Low
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Faceted Filter Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="p-5 bg-neutral-50 rounded-sm border border-neutral-200 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <SlidersHorizontal size={14} /> Filters
              </span>
              {(searchParams.category || searchParams.size || searchParams.fit || searchParams.sort) && (
                <Link href="/shop" className="text-[11px] font-semibold text-rose-600 hover:underline">
                  Reset All
                </Link>
              )}
            </div>

            {/* Category filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2">Category</h4>
              <div className="flex flex-col gap-1.5 text-xs">
                <Link
                  href={{ query: { ...searchParams, category: undefined } }}
                  className={`${!searchParams.category ? 'font-bold text-black' : 'text-neutral-600 hover:text-black'}`}
                >
                  All Categories
                </Link>
                {categories?.map((c) => (
                  <Link
                    key={c.id}
                    href={{ query: { ...searchParams, category: c.slug } }}
                    className={`${searchParams.category === c.slug ? 'font-bold text-black' : 'text-neutral-600 hover:text-black'}`}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Size filter */}
            <div className="pt-4 border-t border-neutral-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2">Size</h4>
              <div className="grid grid-cols-3 gap-2">
                {sizes.map((s) => (
                  <Link
                    key={s}
                    href={{ query: { ...searchParams, size: searchParams.size === s ? undefined : s } }}
                    className={`py-1.5 text-center text-xs font-bold rounded border transition-colors ${
                      searchParams.size === s
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-neutral-800 border-neutral-200 hover:border-black'
                    }`}
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>

            {/* Fit filter */}
            <div className="pt-4 border-t border-neutral-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2">Fit Profile</h4>
              <div className="flex flex-col gap-1.5 text-xs">
                {fits.map((f) => (
                  <Link
                    key={f}
                    href={{ query: { ...searchParams, fit: searchParams.fit === f ? undefined : f } }}
                    className={`${searchParams.fit === f ? 'font-bold text-black' : 'text-neutral-600 hover:text-black'}`}
                  >
                    {f}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <section className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="text-center py-20 bg-neutral-50 rounded border border-neutral-200">
              <Filter className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold uppercase text-neutral-700">No matching garments found</h3>
              <p className="text-xs text-neutral-500 mt-1">Try resetting your size or category filter.</p>
              <Link href="/shop" className="mt-4 inline-block text-xs font-bold uppercase underline">
                Clear all filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

