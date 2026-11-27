import { defineStore } from 'pinia'
import { getThemeSetting, saveThemeSetting } from '../api'
import { i18n, type AppLocale } from '../i18n'

export interface ThemeSettings {
  locale?: AppLocale
  mode: 'light' | 'dark' | 'auto'
  darkSidebar: boolean
  gray: boolean
  weak: boolean
  primary: string
  infoFollow: boolean
  info: string
  success: string
  warning: string
  danger: string
  radius: number
  sidebarWidth: number
  showFooter: boolean
  footerHeight: number
}

export const defaultTheme: ThemeSettings = {
  mode: 'light',
  darkSidebar: true,
  gray: false,
  weak: false,
  primary: '#409eff',
  infoFollow: true,
  info: '#409eff',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  radius: 4,
  sidebarWidth: 210,
  showFooter: false,
  footerHeight: 48,
}

let saveTimer: ReturnType<typeof setTimeout> | undefined

export const useThemeStore = defineStore('theme', {
  state: () => ({ s: { ...defaultTheme } as ThemeSettings }),
  getters: {
    isDark: (state) =>
      state.s.mode === 'dark' ||
      (state.s.mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches),
  },
  actions: {
    /** 套用到 <html>:class + CSS 變數 */
    apply() {
      const el = document.documentElement
      el.classList.toggle('dark', this.isDark)
      el.classList.toggle('gray', this.s.gray)
      el.classList.toggle('weak', this.s.weak)
      el.style.setProperty('--primary', this.s.primary)
      el.style.setProperty('--info', this.s.infoFollow ? this.s.primary : this.s.info)
      el.style.setProperty('--success', this.s.success)
      el.style.setProperty('--warning', this.s.warning)
      el.style.setProperty('--danger', this.s.danger)
      el.style.setProperty('--radius', `${this.s.radius}px`)
      el.style.setProperty('--sidebar-w', `${this.s.sidebarWidth}px`)
    },
    /** 變更設定:立即套用 + 防抖存到後端(每位使用者各自一筆) */
    set(patch: Partial<ThemeSettings>) {
      Object.assign(this.s, patch)
      this.apply()
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        saveThemeSetting(JSON.stringify(this.s)).catch(() => {})
      }, 600)
    },
    /** 登入後載入自己的主題設定 */
    async loadRemote() {
      try {
        const json = await getThemeSetting()
        if (json) {
          const settings = JSON.parse(json)
          // 示範帳號由多位訪客共用，語言以這台瀏覽器目前的選擇為準，不套用帳號裡存的 locale。
          delete settings.locale
          Object.assign(this.s, { ...defaultTheme, ...settings })
        }
        this.s.locale = i18n.global.locale.value
      } catch { /* 無設定或解析失敗 → 用預設 */ }
      this.apply()
    },
    /** 重設為預設值(並存到後端) */
    reset() {
      this.set({ ...defaultTheme, locale: this.s.locale ?? i18n.global.locale.value })
    },
    /** 登出時還原預設外觀,避免下一位使用者看到上一位的主題 */
    resetLocal() {
      this.s = { ...defaultTheme }
      this.apply()
    },
  },
  persist: true, // 本機快取避免重整閃爍;登入後仍以後端為準
})
