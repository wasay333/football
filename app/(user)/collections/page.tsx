import { prisma } from "@/prisma";
import ShopHero from "@/components/shop-hero";
import ProductCarousel from "@/components/product-carousel";

export const dynamic = "force-dynamic";

const COLLECTION_PAGE_LIMIT = 24

const ProductsPage = async () => {
  const [available, preorders] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE", stock: { gt: 0 } },
      take: COLLECTION_PAGE_LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, price: true, mannequinImage: true,
        description: true, stock: true, allowPreorder: true,
        footballer: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", stock: 0, allowPreorder: true },
      take: COLLECTION_PAGE_LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, price: true, mannequinImage: true,
        description: true, stock: true, allowPreorder: true,
        footballer: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
  ]);

  const serialize = (p: typeof available[number]) => ({ ...p, price: Number(p.price) });

  return (
    <div className="shop-page">
      <ShopHero />
      <div className="shop-carousels">
        <ProductCarousel
          products={available.map(serialize)}
          title="AVAILABLE"
          highlight="NOW"
          variant="default"
        />
        {preorders.length > 0 && (
          <ProductCarousel
            products={preorders.map(serialize)}
            title="PRE"
            highlight="ORDER"
            variant="preorder"
          />
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
