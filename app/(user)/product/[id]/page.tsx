import { prisma } from "@/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { isUploadedAssetPath } from "@/lib/image";

export const revalidate = 120;
import ProductActions from "./_components/product-actions";
import CapGallery from "./_components/cap-gallery";
import ReviewList from "./_components/review-list";
import ReviewForm from "./_components/review-form";

type Props = { params: Promise<{ id: string }> };

const SingleProductPage = async ({ params }: Props) => {
  const { id } = await params;

  const [product, reviewStats] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { footballer: true, category: true },
    }),
    prisma.review.aggregate({
      where: { productId: id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  if (!product) notFound();

  const reviewCount = reviewStats._count._all;
  const avgRating = reviewStats._avg.rating ?? 0;

  const { footballer } = product;
  const heroImage = footballer.profileImage || null;

  return (
    <div className="pdp">
      {/* 1. Footballer hero */}
      <div className="pdp-hero">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={footballer.name}
            fill
            sizes="100vw"
            unoptimized={isUploadedAssetPath(heroImage)}
            className="pdp-hero-media"
            priority
          />
        ) : null}

        <div className="pdp-hero-fade" />
      </div>
      {/* 2. Product name */}
      <div className="pdp-name-block">
        <h1 className="pdp-product-name">
          {product.name.split(" ").map((word, i, arr) =>
            i === arr.length - 1 ? (
              <span key={i} className="pdp-product-name--gold">
                {" "}
                {word}
              </span>
            ) : (
              <span key={i}>{word} </span>
            )
          )}
        </h1>
      </div>

      {/* 3. Purchase section */}
      <div className="pdp-purchase">
        <CapGallery
          images={
            [product.capImage1, product.capImage2, product.capImage3].filter(Boolean) as string[]
          }
          name={product.name}
        />

        <div className="pdp-details">
          <p className="pdp-price">${Number(product.price).toFixed(2)}</p>

          {reviewCount > 0 && (
            <div className="pdp-stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  style={{
                    color:
                      s <= Math.round(avgRating)
                        ? "var(--color-gold)"
                        : "rgba(0,0,0,0.2)",
                  }}
                >
                  ★
                </span>
              ))}
              <span className="pdp-stars-count">
                {avgRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          {product.category && <p className="pdp-category">{product.category.name}</p>}

          <ProductActions
            productId={product.id}
            name={product.name}
            price={Number(product.price)}
            image={product.capImage1 ?? ""}
            stock={product.stock}
            allowPreorder={product.allowPreorder}
          />
        </div>
      </div>

      {/* 4. Description below preview and buy section */}
      <div className="pdp-desc-section">
        {footballer.bio && <p className="pdp-desc-bio">&ldquo;{footballer.bio}&rdquo;</p>}
        <div className="pdp-desc-divider" />
        <p className="pdp-desc-body">{product.description}</p>
      </div>

      {/* 5. Reviews */}
      <div className="pdp-reviews-outer">
        <ReviewList productId={product.id} />
        <ReviewForm productId={product.id} />
      </div>
    </div>
  );
};

export default SingleProductPage;
