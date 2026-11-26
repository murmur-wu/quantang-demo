import { defineStore } from 'pinia'
import { getInfo, getRouters, type MenuNode } from '../api'
import { useThemeStore } from './theme'

interface UserInfo {
  userId: number
  userName: string
  nickName: string
  deptName?: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as UserInfo | null,
    roles: [] as string[],
    roleNames: [] as string[], // 顯示用的角色名稱
    dataScopes: [] as string[], // 顯示用;實際範圍一律由後端判斷
    permissions: [] as string[],
    menus: [] as MenuNode[],
    loaded: false, // 動態路由是否已註冊(不持久化,重整後重新載入)
  }),
  getters: {
    isLoggedIn: (s) => !!s.user,
    hasPerm: (s) => (perm: string) =>
      s.permissions.includes('*:*:*') || s.permissions.includes(perm),
  },
  actions: {
    async fetchUser() {
      const info = await getInfo()
      this.user = info.user
      this.roles = info.roles
      this.roleNames = info.roleNames ?? []
      this.dataScopes = info.dataScopes ?? []
      this.permissions = info.permissions
      this.menus = await getRouters()
      await useThemeStore().loadRemote() // 載入自己的主題設定
    },
    logout() {
      this.user = null
      this.roles = []
      this.roleNames = []
      this.dataScopes = []
      this.permissions = []
      this.menus = []
      this.loaded = false
      useThemeStore().resetLocal() // 還原預設外觀,避免影響下一位登入者
    },
  },

})
