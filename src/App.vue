<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Modal from './components/Modal.vue'
import { confirmState, resolveConfirm } from './utils/confirm'
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
    <span>{{ $t('ui.offline') }}</span>
    <span v-if="stillOffline" class="text-secondary">{{ $t('ui.stillOffline') }}</span>
    <button class="rounded bg-primary px-3 py-1 text-white disabled:opacity-60" :disabled="retrying" @click="retry">{{ retrying ? $t('ui.retrying') : $t('ui.retry') }}</button>
  </div>
  <router-view />
  <Modal :show="confirmState.show" :title="$t('common.confirm')" @close="resolveConfirm(false)" @confirm="resolveConfirm(true)">{{ confirmState.text }}</Modal>
</template>
