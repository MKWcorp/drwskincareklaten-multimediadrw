import { NextResponse } from 'next/server';
import { fetchAllPublic } from '@/lib/publicApi';

// Revalidate daily; product slugs come from the public catalog API.
export const revalidate = 86400

import { SITE_CONFIG } from '../../lib/site-config';

export async function GET() {
  const baseUrl = SITE_CONFIG.website.baseUrl;
  
  // Static pages
  const staticPages = [
    '',
    '/product',
    '/faq',
    '/privacy-policy',
  ];

  // Get product slugs dynamically from the public catalog API
  const productSlugs: string[] = [];
  try {
    const items = await fetchAllPublic({ type: 'all' });

    items.forEach((item) => {
      const slug = item.slug || `${item.type}-${item.id}`;
      if (slug && slug.trim() !== '') {
        productSlugs.push(`/product/${slug}`);
      }
    });
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  const allPages = [...staticPages, ...productSlugs];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allPages
  .map((page) => {
    const priority = page === '' ? '1.0' : page.includes('/product/') ? '0.8' : '0.9';
    const changefreq = page === '' ? 'daily' : page.includes('/product/') ? 'weekly' : 'weekly';
    
    return `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}