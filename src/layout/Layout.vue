<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import ThemeDrawer from '../components/ThemeDrawer.vue'
import request from '../api/request'
import { strings } from '../strings'
import { logout as logoutRequest, type MenuNode } from '../api'

const auth = useAuthStore()
const theme = useThemeStore()
const route = useRoute()
const router = useRouter()
const showTheme = ref(false)
const nextReset = ref<string | null>(null)
async function loadReset() { try { const data = await request.get<any, { nextResetUtc: string | null }>('/demo-reset'); nextReset.value = data.nextResetUtc } catch { nextReset.value = null } }
let resetTimer: number
onMounted(() => { loadReset(); resetTimer = window.setInterval(loadReset, 60000) })
onUnmounted(() => clearInterval(resetTimer))

const icons: Record<string, string> = {
  dashboard: '📊', system: '⚙️', user: '👤', role: '🛡️', menu: '📋', dept: '🏢',
}
const icon = (m: MenuNode) => icons[m.icon ?? ''] ?? '·'

function fullPath(m: MenuNode, parent: string): string {
  return m.path ? `${parent}/${m.path}` : parent
}

/** 側欄樣式:深色(prototype 預設)或亮色,由主題設定切換 */
const sidebarClass = () => (theme.s.darkSidebar ? 'bg-[#304156] text-[#bfcbd9]' : 'border-r border-line bg-card text-secondary')
const logoClass = () => (theme.s.darkSidebar ? 'bg-[#2b3a4d] text-white' : 'border-b border-line text-main')
const itemHover = () => (theme.s.darkSidebar ? 'hover:bg-[#263445] hover:text-white' : 'hover:bg-muted hover:text-main')
const itemActive = (p: string) =>
  route.path === p
    ? theme.s.darkSidebar
      ? 'border-r-[3px] border-primary bg-[#263445] !text-primary'
      : 'border-r-[3px] border-primary bg-muted !text-primary'
    : ''
const subBg = () => (theme.s.darkSidebar ? 'bg-[#1f2d3d]' : '')

/* ===== 使用者下拉選單 ===== */
const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

function onDocClick(e: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) showUserMenu.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

function goProfile() {
  showUserMenu.value = false
  router.push('/profile')
}

async function logout() {
  showUserMenu.value = false
  if (!confirm('確定登出嗎?')) return
  await logoutRequest()
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen bg-body text-sm text-main">
    <!-- 側邊選單(由後端權限選單樹渲染) -->
    <aside class="flex shrink-0 flex-col" :class="sidebarClass()" :style="{ width: 'var(--sidebar-w)' }">
      <div class="flex h-14 items-center justify-center gap-2 font-semibold" :class="logoClass()">
        🔐 權糖
      </div>
      <nav class="flex-1 pt-2 text-[13px]">
        <router-link to="/work" class="flex items-center gap-2.5 px-5 py-3" :class="[itemHover(), itemActive('/work')]">📋 專案與工時</router-link>
        <router-link v-if="auth.hasPerm('biz:client:read')" to="/clients" class="flex items-center gap-2.5 px-5 py-3" :class="[itemHover(), itemActive('/clients')]">🏢 客戶</router-link>
        <router-link v-if="auth.hasPerm('biz:permission:matrix')" to="/permission-matrix" class="flex items-center gap-2.5 px-5 py-3" :class="[itemHover(), itemActive('/permission-matrix')]">🛡️ 權限矩陣</router-link>
        <template v-for="m in auth.menus" :key="m.menuId">
          <!-- 目錄 -->
          <template v-if="m.menuType === 'M'">
            <div class="flex items-center gap-2.5 px-5 py-3">
              <span>{{ icon(m) }}</span>{{ m.name }}
            </div>
            <div :class="subBg()">
              <router-link
                v-for="c in m.children"
                :key="c.menuId"
                :to="fullPath(c, `/${m.path}`)"
                class="flex items-center gap-2.5 py-3 pl-11 pr-5"
                :class="[itemHover(), itemActive(fullPath(c, `/${m.path}`))]"
              >
                <span>{{ icon(c) }}</span>{{ c.name }}
              </router-link>
            </div>
          </template>
          <!-- 頂層選單 -->
          <router-link
            v-else
            :to="fullPath(m, '')"
            class="flex items-center gap-2.5 px-5 py-3"
            :class="[itemHover(), itemActive(fullPath(m, ''))]"
          >
            <span>{{ icon(m) }}</span>{{ m.name }}
          </router-link>
        </template>
      </nav>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <!-- 頂欄 -->
      <header class="flex h-14 items-center justify-between border-b border-line bg-card px-5">
        <div class="text-secondary">
          <span v-if="route.meta.parentTitle">{{ route.meta.parentTitle }} / </span>
          <b class="font-medium text-main">{{ route.meta.title ?? '工作台' }}</b>
        </div>
        <div class="flex items-center gap-4">
          <!-- 主題設定 -->
          <button class="text-lg text-secondary hover:text-primary" :title="strings.themeSettings" @click="showTheme = true">🎨</button>
          <div ref="userMenuRef" class="relative">
            <div class="flex cursor-pointer items-center gap-2.5" @click="showUserMenu = !showUserMenu">
              <div class="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-primary font-semibold text-white">
                {{ auth.user?.nickName?.charAt(0) ?? '?' }}
              </div>
              <!-- 姓名與角色(驗收條件 1) -->
              <span class="leading-tight"><b class="block font-medium">{{ auth.user?.nickName }}</b><span class="block text-xs text-secondary">{{ auth.roleNames.join('、') || '未指派角色' }}</span></span>
              <span class="text-disabled">▾</span>
            </div>
            <!-- 使用者下拉選單 -->
            <div v-if="showUserMenu" class="absolute right-0 top-12 z-50 w-36 rounded-md border border-line bg-card py-1 shadow-lg">
              <button class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-main hover:bg-muted" @click="goProfile">
                <span>👤</span> 個人中心
              </button>
              <button class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-main hover:bg-muted" @click="logout">
                <span>⎋</span> {{ strings.logout }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 p-5">
        <router-view />
      </main>

      <!-- 底部(主題設定可開關) -->
      <footer
        v-if="theme.s.showFooter"
        class="flex items-center justify-center border-t border-line bg-card text-xs text-disabled"
        :style="{ height: `${theme.s.footerHeight}px` }"
      >
        Copyright © 2026 權糖 · 下次重置：{{ nextReset ? new Date(nextReset).toLocaleString() : '未排程' }}
      </footer>
    </div>

    <ThemeDrawer :show="showTheme" @close="showTheme = false" />
  </div>
</template>
