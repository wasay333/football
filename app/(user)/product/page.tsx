import { prisma } from "@/prisma";
import AllProductsGrid from "@/components/all-products-grid";

export const dynamic = "force-dynamic";

const ProductsPage = async () => {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      price: true,
      mannequinImage: true,
      description: true,
      stock: true,
      allowPreorder: true,
      footballer: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  return (
    <div className="shop-page">
      <AllProductsGrid
        products={products.map((product) => ({ ...product, price: Number(product.price) }))}
        title="Products"
        eyebrow="Shop All"
        description="Browse every active release in one place, with preorder drops clearly marked right inside the grid."
      />
    </div>
  );
};

export default ProductsPage;
