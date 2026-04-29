import type { MetadataRoute } from 'next'
import { prisma } from '@/prisma'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://foocaps.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, footballers] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, updatedAt: true, footballerId: true },
    }),
    prisma.footballer.findMany({
      select: { id: true, updatedAt: true },
    }),
  ])

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

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const footballerFilterRoutes: MetadataRoute.Sitemap = footballers.map((footballer) => ({
    url: `${baseUrl}/product?footballer=${footballer.id}`,
    lastModified: footballer.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...productRoutes, ...footballerFilterRoutes]
}
