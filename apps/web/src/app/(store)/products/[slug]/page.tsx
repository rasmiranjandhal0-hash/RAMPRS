import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ProductInteractiveDetails } from '@/components/store/ProductInteractiveDetails';
import { ProductCard } from '@/components/store/ProductCard';
import { Product } from '@ramprs/shared';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 60;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data: product } = await supabase
    .from('products')
    .select('title, description, variants:product_variants(images)')
    .eq('slug', params.slug)
    .single();

  if (!product) {
    return { title: 'Garment Not Found | RAMPRS' };
  }

  const primaryImage = product.variants?.[0]?.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518';

  return {
    title: `${product.title} | RAMPRS`,
    description: product.description,
    openGraph: {
      title: `${product.title} | RAMPRS`,
      description: product.description,
      images: [{ url: primaryImage }],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const supabase = createClient();

  // Fetch product with full variants and category
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*)
    `)
    .eq('slug', params.slug)
    .single();

  if (error || !product) {
    notFound();
  }

  // Fetch cross-sell "Complete The Look" products from the same category or active catalog
  const { data: crossSellProducts } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*)
    `)
    .neq('id', product.id)
    .eq('is_active', true)
    .limit(4);

  const defaultVariant = product.variants?.[0];
  const primaryImage = defaultVariant?.images?.[0] || '';
  const priceRupees = (defaultVariant?.sale_price_paise || 0) / 100;

  // JSON-LD Product Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: primaryImage,
    description: product.description,
    sku: defaultVariant?.sku,
    brand: {
      '@type': 'Brand',
      name: 'RAMPRS',
    },
    offers: {
      '@type': 'Offer',
      url: `https://ramprs.com/products/${product.slug}`,
      priceCurrency: 'INR',
      price: priceRupees,
      availability:
        defaultVariant?.stock_quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Main Interactive Product Detail */}
      <ProductInteractiveDetails product={product as Product} />

      {/* Complete The Look / Cross-Sell */}
      {crossSellProducts && crossSellProducts.length > 0 && (
        <section className="pt-12 border-t border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-neutral-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Atelier Styling</span>
              <h2 className="text-2xl font-black uppercase tracking-luxury text-black mt-1">Complete The Look</h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1 sm:mt-0">Curated garments designed to pair seamlessly.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {crossSellProducts.map((p) => (
              <ProductCard key={p.id} product={p as Product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

