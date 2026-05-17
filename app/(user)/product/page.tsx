import { prisma } from "@/prisma";
import AllProductsGrid from "@/components/all-products-grid";
import { PaginationControls } from "@/components/pagination-controls";

export const revalidate = 180;

const PRODUCTS_PER_PAGE = 24;

function normalizePage(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) => {
  const params = await searchParams;
  const requestedPage = normalizePage(params.page);
  const totalProducts = await prisma.product.count({ where: { status: "ACTIVE" } });
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    skip: (currentPage - 1) * PRODUCTS_PER_PAGE,
    take: PRODUCTS_PER_PAGE,
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
      <div className="mx-auto mt-8 w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <PaginationControls basePath="/product" currentPage={currentPage} totalPages={totalPages} />
      </div>
    </div>
  );
};

export default ProductsPage;
