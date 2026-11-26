<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../../api'
import { useAuthStore } from '../../stores/auth'
const router = useRouter()
const auth = useAuthStore()
const userName = ref('')
const password = ref('')
const loading = ref(false)
// 帳號、姓名、角色、可看範圍的一句話。點一列只會帶入帳號,密碼一律自己輸入。
const accounts = [
  ['admin@quantang.demo', '方序', '站台管理員', '全部專案、帳號與權限矩陣'],
  ['east.lead@quantang.demo', '梁東寧', '業務組主管', '只看東岸組的 4 個專案'],
  ['west.lead@quantang.demo', '祁西朗', '業務組主管', '只看西岸組的 4 個專案'],
  ['owner@quantang.demo', '周衡', '專案負責人', '自己負責或被指派的專案，可改任務'],
  ['advisor@quantang.demo', '林青', '顧問', '被指派的專案，只改自己的工時'],
  ['guest@quantang.demo', '參觀者', '參觀訪客', '唯讀一個公開示範專案與矩陣'],
]
async function onSubmit() {
  loading.value = true
  try {
    await login(userName.value, password.value)
    await auth.fetchUser()
    await router.push('/dashboard')
  } catch {
    // 錯誤由 API 攔截器顯示。
  } finally { loading.value = false }
}
</script>
<template>
  <main class="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#304156] to-[#263445] p-4">
    <div class="w-full max-w-2xl rounded-lg bg-card p-8 shadow-2xl">
      <h1 class="text-center text-2xl font-semibold">權糖</h1>
      <p class="mb-6 text-center text-sm text-secondary">墨泉資訊 · 作品集展示</p>
      <form @submit.prevent="onSubmit">
        <label class="mb-3 block text-sm">帳號<input v-model="userName" autocomplete="username" required class="mt-1 w-full rounded border border-line px-3 py-2" /></label>
        <label class="mb-4 block text-sm">密碼<input v-model="password" type="password" autocomplete="current-password" required class="mt-1 w-full rounded border border-line px-3 py-2" /></label>
        <button :disabled="loading" class="w-full rounded bg-primary py-3 text-white disabled:opacity-60">{{ loading ? '登入中…' : '登入' }}</button>
      </form>
      <h2 class="mt-6 font-semibold">示範帳號</h2>
      <p class="text-xs text-secondary">六個帳號的示範密碼都是 <b class="font-mono text-main">123456</b>。點一列可帶入帳號，密碼請自行輸入。</p>
      <table class="mt-2 w-full text-left text-xs">
        <thead><tr class="bg-muted"><th class="p-2">帳號</th><th class="p-2">姓名</th><th class="p-2">角色</th><th class="p-2">可看範圍</th></tr></thead>
        <tbody><tr v-for="account in accounts" :key="account[0]" class="cursor-pointer border-b border-line hover:bg-muted" @click="userName = account[0]"><td class="p-2">{{ account[0] }}</td><td class="whitespace-nowrap p-2">{{ account[1] }}</td><td class="whitespace-nowrap p-2">{{ account[2] }}</td><td class="p-2 text-secondary">{{ account[3] }}</td></tr></tbody>
      </table>
      <p class="mt-5 text-center text-xs"><router-link to="/" class="text-primary hover:underline">← 回作品說明</router-link></p>
    </div>
  </main>
</template>
