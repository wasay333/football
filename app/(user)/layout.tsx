import Header from '@/components/header'
import Footer from '@/components/footer'
import GoogleAnalytics from '@/components/google-analytics'
import { CartProvider } from '@/hooks/cart-context'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <GoogleAnalytics />
      <div className="site-shell" data-release-marker="2026-05-16-a">
        <span className="sr-only">Foocaps build marker 2026-05-16-a</span>
        <Header />
        <main className="site-main">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  )
}
