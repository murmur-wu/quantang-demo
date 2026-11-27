import { i18n } from './i18n'

export const strings = {
  get logout() { return i18n.global.t('common.logout') },
  get themeSettings() { return i18n.global.t('common.themeSettings') },
  get infoColor() { return i18n.global.t('common.infoColor') },
  get layoutSettings() { return i18n.global.t('common.layoutSettings') },
  loadingPlaceholder: '—',
  get loading() { return i18n.global.t('common.loading') },
  get loadFailed() { return i18n.global.t('common.loadFailed') },
  get loginFailed() { return i18n.global.t('common.loginFailed') },
  get sessionExpired() { return i18n.global.t('common.sessionExpired') },
  get me() { return i18n.global.t('common.me') },
  member: (id: number) => i18n.global.t('common.member', { id }),
  myHours: (count: number) => i18n.global.t('common.myHours', { count }),
}
export const sessionExpiredKey = 'session-expired'
