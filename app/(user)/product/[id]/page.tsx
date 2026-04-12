import { prisma } from "@/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import ProductActions from "./_components/product-actions";
import ReviewList from "./_components/review-list";
import ReviewForm from "./_components/review-form";

type Props = { params: Promise<{ id: string }> };

const SingleProductPage = async ({ params }: Props) => {
  const { id } = await params;

  const [product, reviews] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { footballer: true, category: true },
    }),
    prisma.review.findMany({ where: { productId: id }, select: { rating: true } }),
  ]);

  if (!product) notFound();

  const reviewCount = reviews.length;
  const avgRating = reviewCount
    ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviewCount
    : 0;

  const { footballer } = product;
  const heroImage =
    footballer.image1 || footballer.profileImage || null;
  const galleryImages = [
    footballer.image1,
    footballer.image2,
    footballer.image3,
  ].filter(Boolean) as string[];

  return (
    <div className="pdp">
      {/* ── 1. Footballer hero ── */}
      <div className="pdp-hero">
        {footballer.videoUrl ? (
          <video
            className="pdp-hero-media"
            src={footballer.videoUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : heroImage ? (
          <Image
            src={heroImage}
            alt={footballer.name}
            fill
            sizes="100vw"
            className="pdp-hero-media"
            style={{ objectFit: "cover", objectPosition: "top center" }}
          />
        ) : null}

        {footballer.videoUrl && (
          <div className="pdp-hero-play">
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}

        {/* Bottom fade into cream */}
        <div className="pdp-hero-fade" />
      </div>

      {/* ── 3. Footballer diamond gallery ── */}
      {galleryImages.length > 0 && (
        <div className="pdp-diamond-gallery">
          {galleryImages.map((src, i) => (
            <div key={i} className={`pdp-diamond pdp-diamond--${i}`}>
              <div className="pdp-diamond-inner">
                <Image
                  src={src}
                  alt={`${footballer.name} ${i + 1}`}
                  fill
                  sizes="300px"
                  style={{ objectFit: "cover", objectPosition: "top center" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 4. Description below diamonds ── */}
      <div className="pdp-desc-section">
        {footballer.bio && (
          <p className="pdp-desc-bio">&ldquo;{footballer.bio}&rdquo;</p>
        )}
        <div className="pdp-desc-divider" />
        <p className="pdp-desc-body">{product.description}</p>
      </div>

      {/* ── 5. Product name ── */}
      <div className="pdp-name-block">
        <h1 className="pdp-product-name">
          {product.name.split(" ").map((word, i, arr) =>
            i === arr.length - 1 ? (
              <span key={i} className="pdp-product-name--gold">
                {" "}{word}
              </span>
            ) : (
              <span key={i}>{word} </span>
            )
          )}
        </h1>
      </div>

      {/* ── 6. Purchase section ── */}
      <div className="pdp-purchase">
        {/* Cap image */}
        {product.capImage1 && (
          <div className="pdp-cap-wrap">
            <div className="pdp-cap-img">
              <Image
                src={product.capImage1}
                alt={product.name}
                fill
                sizes="320px"
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
        )}

        {/* Details */}
        <div className="pdp-details">
          <p className="pdp-price">${Number(product.price).toFixed(2)}</p>

          {reviewCount > 0 && (
            <div className="pdp-stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={{ color: s <= Math.round(avgRating) ? "var(--color-gold)" : "rgba(15,29,61,0.2)" }}>★</span>
              ))}
              <span className="pdp-stars-count">
                {avgRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          {product.category && (
            <p className="pdp-category">{product.category.name}</p>
          )}

          <ProductActions
            productId={product.id}
            name={product.name}
            price={Number(product.price)}
            image={product.capImage1 ?? ''}
            stock={product.stock}
            allowPreorder={product.allowPreorder}
            sizes={(product as unknown as { sizes: string[] }).sizes ?? []}
          />
        </div>
      </div>

      {/* ── 7. Thumbnails ── */}
      {[product.capImage1, product.capImage2, product.capImage3].some(Boolean) && (
        <div className="pdp-thumbs-row">
          {([product.capImage1, product.capImage2, product.capImage3].filter(Boolean) as string[]).map(
            (src, i) => (
              <div key={i} className="pdp-thumb">
                <Image
                  src={src}
                  alt={`${product.name} view ${i + 1}`}
                  fill
                  sizes="100px"
                  style={{ objectFit: "contain" }}
                />
              </div>
            )
          )}
        </div>
      )}

      {/* ── 8. Reviews ── */}
      <div className="pdp-reviews-outer">
        <ReviewList productId={product.id} />
        <ReviewForm productId={product.id} />
      </div>
    </div>
  );
};

export default SingleProductPage;
