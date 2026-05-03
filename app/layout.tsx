import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://foocaps.com'),
  title: {
    default: 'Foocaps - The Jersey Evolved',
    template: '%s | Foocaps',
  },
  description: 'Player-inspired caps for the FIFA World Cup 2026. Wear the legend.',
  applicationName: 'Foocaps',
  keywords: [
    'Foocaps',
    'football caps',
    'World Cup 2026',
    'football inspired headwear',
    'soccer caps',
    'football merchandise',
    'Messi cap',
    'Ronaldo cap',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Foocaps',
    title: 'Foocaps - The Jersey Evolved',
    description: 'Player-inspired caps for the FIFA World Cup 2026. Wear the legend.',
    images: [
      { url: '/rem1.png', width: 1200, height: 630, alt: 'Foocaps - World Cup 2026 Collection' },
      { url: '/rem2.png', width: 1200, height: 630, alt: 'Foocaps - Player Caps' },
      { url: '/rem3.png', width: 1200, height: 630, alt: 'Foocaps - The Jersey Evolved' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Foocaps - The Jersey Evolved',
    description: 'Player-inspired caps for the FIFA World Cup 2026. Wear the legend.',
    images: ['/rem1.png', '/rem2.png', '/rem3.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/foocaps-search-favicon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/foocaps-search-favicon.png', sizes: '512x512' }],
    shortcut: '/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
