import Header from '@/components/header'
import Footer from '@/components/footer'
import Loader from '@/components/loader'
import { CartProvider } from '@/hooks/cart-context'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <Loader />
      <Header />
      <main>{children}</main>
      <Footer />
    </CartProvider>
  )
}
