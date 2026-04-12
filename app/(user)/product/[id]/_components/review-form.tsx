"use client";

import { useState, useRef } from "react";
import { submitReview } from "./review-actions";

export default function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      setErrorMsg("Please select a star rating.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    fd.set("rating", String(rating));
    const result = await submitReview(fd);
    if (result?.error) {
      setErrorMsg(result.error);
      setStatus("error");
    } else {
      setStatus("success");
      setRating(0);
      formRef.current?.reset();
      setTimeout(() => { setOpen(false); setStatus("idle"); }, 2000);
    }
  }

  if (!open) {
    return (
      <button className="pdp-reviews-btn" onClick={() => setOpen(true)}>
        Write a customer review
      </button>
    );
  }

  return (
    <div className="review-form-wrap">
      <h4 className="review-form-title">Write a Review</h4>

      {/* Star picker */}
      <div className="review-star-picker">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            className={`review-star-btn ${s <= (hovered || rating) ? "active" : ""}`}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(s)}
            aria-label={`${s} star`}
          >
            ★
          </button>
        ))}
        {rating > 0 && (
          <span className="review-star-label">
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
          </span>
        )}
      </div>

      {status === "success" ? (
        <p className="review-success">Thank you for your review!</p>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="review-form">
          <input type="hidden" name="productId" value={productId} />

          <input
            name="name"
            className="review-input"
            placeholder="Your name"
            required
            maxLength={80}
          />

          <textarea
            name="body"
            className="review-textarea"
            placeholder="Share your experience with this product..."
            required
            maxLength={1000}
            rows={4}
          />

          {status === "error" && (
            <p className="review-error">{errorMsg}</p>
          )}

          <div className="review-form-actions">
            <button
              type="button"
              className="review-cancel-btn"
              onClick={() => { setOpen(false); setStatus("idle"); setRating(0); }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="review-submit-btn"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
