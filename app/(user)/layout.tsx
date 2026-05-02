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
      <Header />
      <main>{children}</main>
      <Footer />
    </CartProvider>
  )
}
