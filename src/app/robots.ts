import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vistoria-pro.com.br'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/disputes/',
          '/landlord/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
