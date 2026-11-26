<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
const route = useRoute(), router = useRouter()
const auth = useAuthStore()
// 被擋下的原始路徑,只用來顯示,不會自動重試。
const from = computed(() => (typeof route.query.from === 'string' ? route.query.from : ''))
</script>
<template>
  <div class="flex min-h-[60vh] items-center justify-center">
    <div class="w-full max-w-md rounded bg-card p-8 text-center shadow-sm">
      <p class="text-5xl font-bold text-primary">403</p>
      <h1 class="mt-3 text-lg font-semibold">沒有權限執行此操作</h1>
      <p class="mt-2 text-secondary">
        目前登入的帳號（{{ auth.user?.nickName ?? '未知' }}）沒有這個頁面的權限，或這筆資料不在你的資料範圍內。
      </p>
      <p v-if="from" class="mt-2 break-all text-xs text-disabled">被拒絕的路徑：{{ from }}</p>
      <p class="mt-2 text-xs text-disabled">權限與資料範圍由後端判斷；可換另一個示範帳號對照。</p>
      <div class="mt-6 flex justify-center gap-3">
        <button class="rounded bg-primary px-4 py-2 text-white" @click="router.replace('/dashboard')">回工作台</button>
        <button class="rounded border border-line px-4 py-2 hover:text-primary" @click="router.replace('/work')">專案與工時</button>
      </div>
    </div>
  </div>
</template>
