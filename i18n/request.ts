import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

export const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'pt'

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function detectLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE
  const langs = header.split(',').map(s => s.split(';')[0].trim().toLowerCase())
  for (const lang of langs) {
    const short = lang.slice(0, 2)
    if (isLocale(short)) return short
  }
  return DEFAULT_LOCALE
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  let locale: Locale = DEFAULT_LOCALE
  if (isLocale(cookieLocale)) {
    locale = cookieLocale
  } else {
    const h = await headers()
    locale = detectLocaleFromAcceptLanguage(h.get('accept-language'))
  }

  const messages = (await import(`../messages/${locale}.json`)).default
  return { locale, messages }
})
