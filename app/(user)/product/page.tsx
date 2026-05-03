import { prisma } from "@/prisma";
import Image from "next/image";
import Link from "next/link";
import ShopHero from "@/components/shop-hero";

export const dynamic = "force-dynamic";

const ProductsPage = async () => {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      price: true,
      capImage1: true,
      description: true,
      stock: true,
      allowPreorder: true,
      footballer: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  return (
    <div className="shop-page">
      <ShopHero />

      <div className="shop-body shop-body--full">
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
                    <div className="shop-card-img">
                      {product.capImage1 && (
                        <Image
                          src={product.capImage1}
                          alt={product.name}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      )}
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
