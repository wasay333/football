export function isUploadedAssetPath(src: string | null | undefined): boolean {
  return typeof src === 'string' && src.startsWith('/assets/')
}
