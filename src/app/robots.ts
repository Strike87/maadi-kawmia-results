import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api'],
      },
    ],
    sitemap: 'https://maadi-kawmia-results.vercel.app/sitemap.xml',
  };
}
