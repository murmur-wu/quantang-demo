import { createI18n } from 'vue-i18n'
import zhTW from './locales/zh-TW'
import en from './locales/en'
import ja from './locales/ja'
import zhCN from './locales/zh-CN'

export const SUPPORTED_LOCALES = ['zh-TW', 'en', 'ja', 'zh-CN'] as const
export type AppLocale = typeof SUPPORTED_LOCALES[number]
export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}
export function detectLocale(): AppLocale {
  try { const stored = localStorage.getItem('locale'); if (isAppLocale(stored)) return stored } catch { /* storage unavailable */ }
  for (const language of navigator.languages?.length ? navigator.languages : [navigator.language]) {
    const tag = language.toLowerCase()
    if (/^zh-(hant|tw|hk|mo)(-|$)/.test(tag)) return 'zh-TW'
    if (/^zh-(hans|cn|sg)(-|$)/.test(tag)) return 'zh-CN'
    if (tag === 'zh' || tag.startsWith('zh-')) return 'zh-TW'
    if (/^ja(-|$)/.test(tag)) return 'ja'
    if (/^en(-|$)/.test(tag)) return 'en'
  }
  return 'zh-TW'
}
export const i18n = createI18n({ legacy: false, locale: detectLocale(), fallbackLocale: 'zh-TW', messages: { 'zh-TW': zhTW, en, ja, 'zh-CN': zhCN } })
export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  try { localStorage.setItem('locale', locale) } catch { /* storage unavailable */ }
  document.documentElement.lang = { 'zh-TW': 'zh-Hant-TW', en: 'en', ja: 'ja', 'zh-CN': 'zh-Hans-CN' }[locale]
  document.documentElement.dataset.locale = locale
  window.dispatchEvent(new Event('locale-change'))
}
