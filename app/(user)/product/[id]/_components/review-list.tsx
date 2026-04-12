import { prisma } from "@/prisma";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default async function ReviewList({ productId }: { productId: string }) {
  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });

  const count = reviews.length;
  const avg = count
    ? (reviews.reduce((s, r) => s + r.rating, 0) / count).toFixed(1)
    : null;

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="pdp-reviews-section">
      {/* Header */}
      <div className="pdp-reviews-header">
        <h2 className="pdp-reviews-heading">Customer Reviews</h2>
        {avg && (
          <div className="pdp-reviews-summary">
            <span className="pdp-reviews-avg">{avg}</span>
            <div className="pdp-reviews-avg-stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={s <= Math.round(Number(avg)) ? "star-filled" : "star-empty"}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="pdp-reviews-count">{count} {count === 1 ? "review" : "reviews"}</span>
          </div>
        )}
      </div>

      {/* Rating distribution bar */}
      {count > 0 && (
        <div className="pdp-reviews-dist">
          {dist.map(({ star, count: c }) => (
            <div key={star} className="pdp-reviews-dist-row">
              <span className="pdp-reviews-dist-label">{star} ★</span>
              <div className="pdp-reviews-dist-bar">
                <div
                  className="pdp-reviews-dist-fill"
                  style={{ width: count > 0 ? `${(c / count) * 100}%` : "0%" }}
                />
              </div>
              <span className="pdp-reviews-dist-num">{c}</span>
            </div>
          ))}
        </div>
      )}

      {/* Review list */}
      {count === 0 ? (
        <p className="pdp-reviews-empty">No reviews yet. Be the first to write one!</p>
      ) : (
        <div className="pdp-reviews-list">
          {reviews.map((r) => (
            <div key={r.id} className="pdp-review-card">
              <div className="pdp-review-top">
                <div className="pdp-review-avatar">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="pdp-review-meta">
                  <span className="pdp-review-name">{r.name}</span>
                  <span className="pdp-review-date">{timeAgo(r.createdAt)}</span>
                </div>
                <div className="pdp-review-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={s <= r.rating ? "star-filled" : "star-empty"}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="pdp-review-body">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
