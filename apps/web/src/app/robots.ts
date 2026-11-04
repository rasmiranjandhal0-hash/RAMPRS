import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/account/', '/checkout/', '/api/'],
    },
    sitemap: 'https://ramprs.com/sitemap.xml',
  };
}

