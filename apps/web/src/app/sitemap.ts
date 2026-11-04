import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ramprs.com';
  const supabase = createClient();

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Dynamic products
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true);

  if (products) {
    products.forEach((p) => {
      routes.push({
        url: `${baseUrl}/products/${p.slug}`,
        lastModified: new Date(p.updated_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });
  }

  // Dynamic categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')
    .eq('is_active', true);

  if (categories) {
    categories.forEach((c) => {
      routes.push({
        url: `${baseUrl}/collections/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });
  }

  return routes;
}

