import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ProductMatrixBuilder } from './ProductMatrixBuilder';

export const revalidate = 0;

export default async function AdminProductsPage() {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');

  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name),
      variants:product_variants(*)
    `)
    .order('created_at', { ascending: false });

  return (
    <ProductMatrixBuilder
      categories={categories || []}
      existingProducts={products || []}
    />
  );
}

