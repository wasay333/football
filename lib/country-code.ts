const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  pakistan: 'PK',
  'united kingdom': 'GB',
  uk: 'GB',
  britain: 'GB',
  england: 'GB',
  'great britain': 'GB',
  'united states': 'US',
  'united states of america': 'US',
  usa: 'US',
  germany: 'DE',
  france: 'FR',
  spain: 'ES',
  italy: 'IT',
  netherlands: 'NL',
  belgium: 'BE',
  portugal: 'PT',
  ireland: 'IE',
  sweden: 'SE',
  norway: 'NO',
  denmark: 'DK',
  finland: 'FI',
  switzerland: 'CH',
  austria: 'AT',
  poland: 'PL',
  australia: 'AU',
  canada: 'CA',
  uae: 'AE',
  'united arab emirates': 'AE',
  nigeria: 'NG',
  ghana: 'GH',
  'south africa': 'ZA',
}

export function normalizeCountryCode(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return ''

  const upper = trimmed.toUpperCase()
  if (/^[A-Z]{2}$/.test(upper)) {
    return upper
  }

  return COUNTRY_NAME_TO_CODE[trimmed.toLowerCase()] ?? ''
}
