import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

/**
 * Saves an uploaded File to public/assets/<subfolder> and returns the public URL path.
 * subfolder examples: 'products/images', 'products/videos', 'footballers/images', 'footballers/videos'
 */
export async function saveUploadedFile(file: File, subfolder: string): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = path.extname(file.name) || ''
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  const dir = path.join(process.cwd(), 'public', 'assets', subfolder)

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
  try {
    await unlink(path.join(process.cwd(), 'public', urlPath))
  } catch {
    // Ignore — file may already be missing
  }
}
