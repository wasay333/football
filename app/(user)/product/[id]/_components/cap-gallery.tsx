'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { isUploadedAssetPath } from '@/lib/image'

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
  const [bounds, setBounds] = useState({ width: 280, height: 280 })
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

  useEffect(() => {
    if (!images.length) return

    const el = wrapRef.current
    if (!el) return

    const updateBounds = () => {
      const rect = el.getBoundingClientRect()
      setBounds({
        width: rect.width || 280,
        height: rect.height || 280,
      })
    }

    updateBounds()

    const observer = new ResizeObserver(updateBounds)
    observer.observe(el)

    return () => observer.disconnect()
  }, [active, images.length])

  if (!images.length) return null

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
            unoptimized={isUploadedAssetPath(images[active])}
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
              backgroundSize: `${bounds.width * ZOOM}px ${bounds.height * ZOOM}px`,
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
                unoptimized={isUploadedAssetPath(src)}
                style={{ objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
