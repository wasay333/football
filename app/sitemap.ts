import type { MetadataRoute } from 'next'
import { prisma } from '@/prisma'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://foocaps.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/product`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // Image builds in CI do not have database access, so fall back to static routes.
  if (!process.env.DATABASE_URL) {
    return staticRoutes
  }

  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, updatedAt: true },
  })

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...productRoutes]
}
