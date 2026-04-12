import { prisma } from "@/prisma";
import Image from "next/image";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ footballer?: string }>;
};

const ProductsPage = async ({ searchParams }: Props) => {
  const { footballer: footballerFilter } = await searchParams;

  const [products, footballers] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ...(footballerFilter ? { footballerId: footballerFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        capImage1: true,
        description: true,
        stock: true,
        allowPreorder: true,
        footballer: { select: { id: true, name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.footballer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="shop-page">
      {/* Page Hero */}
      <div className="shop-hero">
        <div className="shop-hero-inner">
          <p className="shop-hero-eyebrow">Foocaps</p>
          <h1 className="shop-hero-title">
            All <span>Products</span>
          </h1>
          <p className="shop-hero-sub">
            {products.length} cap{products.length !== 1 ? "s" : ""} in the
            collection
          </p>
        </div>
      </div>

      <div className="shop-body">
        {/* Sidebar filters */}
        <aside className="shop-sidebar">
          <div className="shop-filter-group">
            <h3 className="shop-filter-label">Footballer</h3>
            <ul className="shop-filter-list">
              <li>
                <Link
                  href="/product"
                  className={`shop-filter-item${!footballerFilter ? " shop-filter-item--active" : ""}`}
                >
                  All
                </Link>
              </li>
              {footballers.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/product?footballer=${f.id}`}
                    className={`shop-filter-item${footballerFilter === f.id ? " shop-filter-item--active" : ""}`}
                  >
                    {f.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Product grid */}
        <section className="shop-grid-area">
          {products.length === 0 ? (
            <div className="shop-empty">
              <p>No products available yet. Check back soon.</p>
            </div>
          ) : (
            <div className="shop-grid">
              {products.map((product) => {
                const inStock = product.stock > 0 || product.allowPreorder;
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="shop-card"
                  >
                    {/* Image */}
                    <div className="shop-card-img">
                      {product.capImage1 && (
                        <Image
                          src={product.capImage1}
                          alt={product.name}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      )}
                      {/* Badges */}
                      <div className="shop-card-badges">
                        {!inStock && (
                          <span className="shop-badge shop-badge--sold">
                            Sold Out
                          </span>
                        )}
                        {product.allowPreorder && product.stock === 0 && (
                          <span className="shop-badge shop-badge--pre">
                            Pre-order
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="shop-card-body">
                      {product.footballer && (
                        <span className="shop-card-footballer">
                          {product.footballer.name}
                        </span>
                      )}
                      <h3 className="shop-card-name">{product.name}</h3>
                      {product.category && (
                        <p className="shop-card-category">
                          {product.category.name}
                        </p>
                      )}
                      <div className="shop-card-footer">
                        <span className="shop-card-price">
                          ${Number(product.price).toFixed(2)}
                        </span>
                        <span className="shop-card-cta">View →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductsPage;
