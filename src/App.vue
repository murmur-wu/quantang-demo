<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useThemeStore } from './stores/theme'
import { connection } from './utils/connection'
import { ping } from './api/request'

const theme = useThemeStore()
onMounted(() => {
  theme.apply()
  // 主題模式=自動時,跟隨系統深淺色即時切換
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => theme.apply())
})

const retrying = ref(false)
const stillOffline = ref(false)
async function retry() {
  retrying.value = true
  stillOffline.value = false
  // 恢復後重新載入目前頁面,讓剛才失敗的資料重新讀取。
  if (await ping()) location.reload()
  else stillOffline.value = true
  retrying.value = false
}
</script>

<template>
  <div v-if="connection.offline" role="alert" class="sticky top-0 z-[9998] flex flex-wrap items-center justify-center gap-3 border-b border-warning bg-[color-mix(in_srgb,var(--warning)_18%,var(--card))] px-4 py-2.5 text-sm text-main">
    <span><b>展示主機目前離線。</b>後端暫時連不上，請稍後再試；這不是帳號或密碼錯誤。</span>
    <span v-if="stillOffline" class="text-secondary">仍然連不上，請稍後再試。</span>
    <button class="rounded bg-primary px-3 py-1 text-white disabled:opacity-60" :disabled="retrying" @click="retry">{{ retrying ? '重試中…' : '重試' }}</button>
  </div>
  <router-view />
</template>
