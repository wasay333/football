'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function CapGallery({
  images,
  name,
}: {
  images: string[]
  name: string
}) {
  const [active, setActive] = useState(0)

  if (!images.length) return null

  return (
    <div className="pdp-cap-section">
      <div className="pdp-cap-wrap">
        <div className="pdp-cap-img">
          <Image
            src={images[active]}
            alt={name}
            fill
            sizes="320px"
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
      </div>

      {images.length > 1 && (
        <div className="pdp-thumbs-row">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="pdp-thumb"
              style={{ borderColor: i === active ? 'var(--color-gold)' : 'transparent' }}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={src}
                alt={`${name} view ${i + 1}`}
                fill
                sizes="80px"
                style={{ objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
