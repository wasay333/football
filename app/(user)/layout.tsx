import Header from '@/components/header'
import Footer from '@/components/footer'
import { CartProvider } from '@/hooks/cart-context'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <div className="site-shell">
        <Header />
        <main className="site-main">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  )
}
