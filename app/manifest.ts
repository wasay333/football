import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Foocaps',
    short_name: 'Foocaps',
    description: 'Player-inspired caps for the FIFA World Cup 2026. Wear the legend.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0e0e0e',
    theme_color: '#0e0e0e',
    icons: [
      {
        src: '/favicon-48x48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/foocaps-search-favicon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
