import { i18n } from './index'

export function formatDateTime(value: string | number | Date, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(i18n.global.locale.value, { timeZone: 'Asia/Taipei', dateStyle: 'medium', timeStyle: 'short', ...options }).format(new Date(value))
}
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(i18n.global.locale.value).format(value)
}

export function formatDate(value: string | number | Date): string {
  return new Intl.DateTimeFormat(i18n.global.locale.value, { timeZone: 'Asia/Taipei', dateStyle: 'medium' }).format(new Date(value))
}
