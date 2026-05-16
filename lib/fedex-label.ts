function readEnv(name: string, fallback?: string) {
  return process.env[name]?.trim() || fallback || ''
}

export function extractFedExLabelUrlFromText(text: string) {
  const match = text.match(/label:\s*(https?:\/\/\S+)/i)
  return match?.[1] ?? ''
}

export function extractFedExLabelUrlFromNotes(notes: Array<string | null | undefined>) {
  for (const note of notes) {
    if (!note) continue

    const url = extractFedExLabelUrlFromText(note)
    if (url) {
      return url
    }
  }

  return ''
}

export function getFedExLabelMimeType() {
  const imageType = readEnv('FEDEX_LABEL_IMAGE_TYPE', 'PDF').toUpperCase()

  switch (imageType) {
    case 'PNG':
      return 'image/png'
    case 'JPG':
    case 'JPEG':
      return 'image/jpeg'
    case 'ZPLII':
    case 'ZPL':
    case 'EPL2':
      return 'text/plain; charset=utf-8'
    case 'PDF':
    default:
      return 'application/pdf'
  }
}

export function getFedExLabelFileExtension() {
  const mimeType = getFedExLabelMimeType()

  switch (mimeType) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
      return 'jpg'
    case 'text/plain; charset=utf-8':
      return 'txt'
    case 'application/pdf':
    default:
      return 'pdf'
  }
}
