import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ShopPage from '../../shop/page';
import { Metadata } from 'next';

interface CollectionPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    size?: string;
    fit?: string;
    sort?: string;
  };
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('slug', params.slug)
    .single();

  if (!category) {
    return { title: 'Collection | RAMPRS' };
  }

  return {
    title: `${category.name} Collection | RAMPRS`,
    description: `Explore the RAMPRS ${category.name} collection. Engineered with high-thread density, bespoke cuts, and luxury finishes.`,
  };
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!category) {
    notFound();
  }

  return (
    <ShopPage
      searchParams={{
        ...searchParams,
        category: params.slug,
      }}
    />
  );
}

