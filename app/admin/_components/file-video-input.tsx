'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'

export function FileVideoInput({
  name,
  existingUrl,
  error,
}: {
  name: string
  existingUrl?: string | null
  error?: string
}) {
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null)
  const [existingValue, setExistingValue] = useState(existingUrl ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    setPreview(null)
    setExistingValue('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-1">
      <div
        className="relative flex h-40 w-full max-w-sm cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/30 transition-colors hover:border-muted-foreground/60"
        onClick={() => { if (!preview) inputRef.current?.click() }}
      >
        {preview ? (
          <>
            <video src={preview} controls className="h-full w-full object-contain" />
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
            >
              <X className="size-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Upload className="size-5" />
            <span className="text-xs">Choose video</span>
          </div>
        )}
      </div>
      <input type="hidden" name={`${name}_existing`} value={existingValue} />
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="video/*"
        className="hidden"
        onChange={handleChange}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
