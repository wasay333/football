'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

const ZOOM = 2.5
const LENS = 130

export default function CapGallery({
  images,
  name,
}: {
  images: string[]
  name: string
}) {
  const [active, setActive] = useState(0)
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setLens({
      x: Math.max(LENS / 2, Math.min(x, rect.width - LENS / 2)),
      y: Math.max(LENS / 2, Math.min(y, rect.height - LENS / 2)),
    })
  }, [])

  const onLeave = useCallback(() => setLens(null), [])

  if (!images.length) return null

  const w = wrapRef.current?.offsetWidth ?? 280
  const h = wrapRef.current?.offsetHeight ?? 280

  return (
    <div className="pdp-cap-section">
      <div
        ref={wrapRef}
        className="pdp-cap-wrap"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ cursor: lens ? 'crosshair' : 'zoom-in' }}
      >
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

        {lens && (
          <div
            className="pdp-magnifier"
            style={{
              left: lens.x,
              top: lens.y,
              backgroundImage: `url(${images[active]})`,
              backgroundSize: `${w * ZOOM}px ${h * ZOOM}px`,
              backgroundPosition: `${-(lens.x * ZOOM - LENS / 2)}px ${-(lens.y * ZOOM - LENS / 2)}px`,
            }}
          />
        )}
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
