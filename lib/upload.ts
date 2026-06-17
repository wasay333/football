import { randomUUID } from 'crypto'
import { mkdir, unlink, writeFile } from 'fs/promises'
import path from 'path'

const uploadConfigs = {
  'products/images': {
    allowedExtensions: new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']),
    allowedMimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']),
    maxBytes: 10 * 1024 * 1024,
  },
  'footballers/images': {
    allowedExtensions: new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']),
    allowedMimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']),
    maxBytes: 10 * 1024 * 1024,
  },
  'reviews/images': {
    allowedExtensions: new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']),
    allowedMimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']),
    maxBytes: 5 * 1024 * 1024,
  },
} as const

type UploadSubfolder = keyof typeof uploadConfigs

function resolveManagedUploadPath(urlPath: string): string | null {
  if (!urlPath.startsWith('/assets/')) {
    return null
  }

  const publicRoot = path.resolve(process.cwd(), 'public')
  const assetsRoot = path.resolve(publicRoot, 'assets')
  const absolutePath = path.resolve(publicRoot, `.${urlPath}`)

  if (absolutePath !== assetsRoot && !absolutePath.startsWith(`${assetsRoot}${path.sep}`)) {
    return null
  }

  return absolutePath
}

/**
 * Saves an uploaded File to public/assets/<subfolder> and returns the public URL path.
 */
export async function saveUploadedFile(file: File, subfolder: UploadSubfolder): Promise<string> {
  const config = uploadConfigs[subfolder]
  const ext = path.extname(file.name).toLowerCase()
  const mimeType = file.type.toLowerCase()

  if (file.size <= 0) {
    throw new Error('Uploaded file is empty')
  }

  if (file.size > config.maxBytes) {
    throw new Error('Uploaded file is too large')
  }

  if (!config.allowedExtensions.has(ext) || !config.allowedMimeTypes.has(mimeType)) {
    throw new Error('Uploaded file type is not allowed')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const filename = `${randomUUID()}${ext}`
  const dir = path.resolve(process.cwd(), 'public', 'assets', subfolder)

  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)

  return `/assets/${subfolder}/${filename}`
}

/**
 * Deletes a previously uploaded file given its public URL path (e.g. /assets/footballers/images/xxx.jpg).
 * Silently ignores missing files.
 */
export async function deleteUploadedFile(urlPath: string | null | undefined): Promise<void> {
  if (!urlPath) return

  const managedPath = resolveManagedUploadPath(urlPath)
  if (!managedPath) return

  try {
    await unlink(managedPath)
  } catch {
    // Ignore missing files.
  }
}
