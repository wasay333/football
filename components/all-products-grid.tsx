import Image from "next/image";
import Link from "next/link";
import {
  formatMoney,
  getBestMultiPurchaseDiscount,
  getSinglePurchaseDiscount,
  type DiscountRuleSummary,
} from "@/lib/discount-display";

type Product = {
  id: string;
  name: string;
  price: number;
  mannequinImage: string | null;
  stock: number;
  allowPreorder: boolean;
  footballer: { name: string } | null;
};

type Props = {
  products: Product[];
  title?: string;
  eyebrow?: string;
  description?: string;
  discountRules?: DiscountRuleSummary[];
};

export default function AllProductsGrid({
  products,
  title = "Collections",
  eyebrow = "All Products",
  description = "Explore the full lineup, including ready-to-ship drops and preorder releases.",
  discountRules = [],
}: Props) {
  return (
    <section className="shop-listing-section">
      <div className="shop-body shop-body--full">
        <div className="shop-grid-intro">
          <div>
            <span className="shop-grid-eyebrow">{eyebrow}</span>
            <h2 className="shop-grid-title">{title}</h2>
          </div>
          <p className="shop-grid-copy">{description}</p>
        </div>

        {products.length === 0 ? (
          <div className="shop-empty">No active products are available right now.</div>
        ) : (
          <div className="shop-grid-area shop-grid-area--full">
            <div className="shop-grid">
              {products.map((product) => {
                const isPreorder = product.stock === 0 && product.allowPreorder;
                const isSoldOut = product.stock === 0 && !product.allowPreorder;
                const ctaLabel = isPreorder ? "Pre-order" : isSoldOut ? "View details" : "Shop now";
                const singleDiscount = getSinglePurchaseDiscount(product.price, discountRules);
                const multiDiscount = getBestMultiPurchaseDiscount(product.price, discountRules);

                return (
                  <Link key={product.id} href={`/product/${product.id}`} className="shop-card">
                    <div className="shop-card-img">
                      {product.mannequinImage ? (
                        <Image
                          src={product.mannequinImage}
                          alt={product.name}
                          fill
                          sizes="(max-width: 480px) 50vw, (max-width: 1100px) 50vw, 33vw"
                          unoptimized
                          style={{ objectFit: "cover", objectPosition: "center center" }}
                        />
                      ) : (
                        <div className="shop-card-img-fallback">No image available</div>
                      )}

                      <div className="shop-card-badges">
                        {isSoldOut && <span className="shop-badge shop-badge--sold">Sold out</span>}
                      </div>

                      {isPreorder && (
                        <span className="shop-badge shop-badge--pre shop-badge--image-bottom">
                          {ctaLabel}
                        </span>
                      )}
                    </div>

                    <div className="shop-card-body">
                      {product.footballer && (
                        <span className="shop-card-footballer">{product.footballer.name}</span>
                      )}
                      <h3 className="shop-card-name">{product.name}</h3>
                      {singleDiscount && (
                        <p className="price-save-line">
                          Save {singleDiscount.savePercent}% on this cap
                        </p>
                      )}
                      {!singleDiscount && multiDiscount && (
                        <p className="price-save-line">
                          Buy {multiDiscount.itemCount}, save {multiDiscount.savePercent}%
                        </p>
                      )}

                      <div className="shop-card-footer">
                        <span className="price-stack">
                          {singleDiscount ? (
                            <>
                              <span className="price-current">{formatMoney(singleDiscount.salePrice)}</span>
                              <span className="price-was">{formatMoney(singleDiscount.originalPrice)}</span>
                            </>
                          ) : (
                            <span className="price-current">{formatMoney(product.price)}</span>
                          )}
                        </span>
                        <span className="shop-card-cta">{ctaLabel}</span>
                      </div>
                      {multiDiscount && (
                        <p className="price-offer-line">
                          {multiDiscount.name}: {formatMoney(multiDiscount.fixedTotal)} total
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
