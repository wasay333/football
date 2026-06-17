"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";

type ReviewImageGalleryProps = {
  images: string[];
  reviewerName: string;
};

export default function ReviewImageGallery({
  images,
  reviewerName,
}: ReviewImageGalleryProps) {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  return (
    <>
      <div className="pdp-review-images">
        {images.map((image, index) => (
          <button
            key={`${reviewerName}-${image}`}
            type="button"
            className="pdp-review-image-link"
            aria-label={`Open review photo ${index + 1} from ${reviewerName}`}
            onClick={() => setActiveImage(image)}
          >
            <Image
              src={image}
              alt={`Review photo ${index + 1} from ${reviewerName}`}
              className="pdp-review-image"
              width={320}
              height={320}
              loading="lazy"
              unoptimized
            />
          </button>
        ))}
      </div>

      {activeImage && (
        <div
          className="review-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Review photo from ${reviewerName}`}
          onClick={() => setActiveImage(null)}
        >
          <button
            type="button"
            className="review-lightbox-close"
            aria-label="Close review image"
            onClick={() => setActiveImage(null)}
          >
            <X className="size-5" />
          </button>

          <div
            className="review-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeImage}
              alt={`Expanded review photo from ${reviewerName}`}
              className="review-lightbox-image"
              width={1200}
              height={1200}
              priority
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  );
}
