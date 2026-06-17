"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { submitReview } from "./review-actions";

const MAX_REVIEW_IMAGES = 3;

export default function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  function clearSelectedImages() {
    setPreviewUrls((current) => {
      current.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);

    if (files.length > MAX_REVIEW_IMAGES) {
      clearSelectedImages();
      setErrorMsg(`You can upload up to ${MAX_REVIEW_IMAGES} review photos.`);
      setStatus("error");
      return;
    }

    setErrorMsg("");
    setStatus("idle");
    setPreviewUrls((current) => {
      current.forEach((url) => URL.revokeObjectURL(url));
      return files.map((file) => URL.createObjectURL(file));
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      setErrorMsg("Please select a star rating.");
      setStatus("error");
      return;
    }

    const selectedFiles = fileInputRef.current?.files;
    if (selectedFiles && selectedFiles.length > MAX_REVIEW_IMAGES) {
      setErrorMsg(`You can upload up to ${MAX_REVIEW_IMAGES} review photos.`);
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
      clearSelectedImages();
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
          <input type="hidden" name="startedAt" value={startedAt} />
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
          />

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

          <label className="review-upload-field">
            <span className="review-upload-label">Add up to 3 photos</span>
            <input
              ref={fileInputRef}
              type="file"
              name="images"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              multiple
              className="review-file-input"
              onChange={handleImageChange}
            />
            <span className="review-upload-help">
              JPG, PNG, WebP, AVIF, or GIF. Max 5MB each.
            </span>
          </label>

          {previewUrls.length > 0 && (
            <div className="review-upload-preview">
              {previewUrls.map((url, index) => (
                <Image
                  key={url}
                  src={url}
                  alt={`Selected review photo ${index + 1}`}
                  className="review-upload-thumb"
                  width={160}
                  height={160}
                  unoptimized
                />
              ))}
            </div>
          )}

          {status === "error" && (
            <p className="review-error">{errorMsg}</p>
          )}

          <div className="review-form-actions">
            <button
              type="button"
              className="review-cancel-btn"
              onClick={() => {
                setOpen(false);
                setStatus("idle");
                setRating(0);
                setErrorMsg("");
                clearSelectedImages();
              }}
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
