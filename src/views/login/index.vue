<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LocaleSwitcher from '../../components/LocaleSwitcher.vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../../api'
import { useAuthStore } from '../../stores/auth'
import { sessionExpiredKey } from '../../strings'
import { message } from '../../utils/message'
const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const userName = ref('')
const password = ref('')
const loading = ref(false)
onMounted(() => {
  if (sessionStorage.getItem(sessionExpiredKey)) {
    sessionStorage.removeItem(sessionExpiredKey)
    message(t('common.sessionExpired'), 'error')
  }
})
// 帳號、姓名、角色、可看範圍的一句話。點一列只會帶入帳號,密碼一律自己輸入。
const accounts = computed(() => [
  ['admin@quantang.demo', '方序', t('public.adminRole'), t('public.adminShort')],
  ['east.lead@quantang.demo', '梁東寧', t('public.leadRole'), t('public.eastShort')],
  ['west.lead@quantang.demo', '祁西朗', t('public.leadRole'), t('public.westShort')],
  ['owner@quantang.demo', '周衡', t('public.ownerRole'), t('public.ownerShort')],
  ['advisor@quantang.demo', '林青', t('public.advisorRole'), t('public.advisorShort')],
  ['guest@quantang.demo', '參觀者', t('public.guestRole'), t('public.guestShort')],
])
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
  <div class="fixed right-4 top-4 z-40"><LocaleSwitcher /></div>
  <main class="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#304156] to-[#263445] p-4">
    <div class="w-full max-w-2xl rounded-lg bg-card p-8 shadow-2xl">
      <h1 class="text-center text-2xl font-semibold">權糖</h1>
      <p class="mb-6 text-center text-sm text-secondary">{{ t('public.loginSubtitle') }}</p>
      <form @submit.prevent="onSubmit">
        <label class="mb-3 block text-sm">{{ t('public.account') }}<input v-model="userName" autocomplete="username" required class="mt-1 w-full rounded border border-line px-3 py-2" /></label>
        <label class="mb-4 block text-sm">{{ t('public.password') }}<input v-model="password" type="password" autocomplete="current-password" required class="mt-1 w-full rounded border border-line px-3 py-2" /></label>
        <button :disabled="loading" class="w-full rounded bg-primary py-3 text-white disabled:opacity-60">{{ loading ? t('public.loggingIn') : t('public.login') }}</button>
      </form>
      <h2 class="mt-6 font-semibold">{{ t('public.demoAccounts') }}</h2>
      <p class="text-xs text-secondary">{{ t('public.demoPasswordBefore') }}  <b class="font-mono text-main">123456</b>{{ t('public.demoPasswordAfter') }}</p>
      <table class="mt-2 w-full text-left text-xs">
        <thead><tr class="bg-muted"><th class="p-2">{{ t('public.account') }}</th><th class="p-2">{{ t('public.name') }}</th><th class="p-2">{{ t('public.role') }}</th><th class="p-2">{{ t('public.visibleScope') }}</th></tr></thead>
        <tbody><tr v-for="account in accounts" :key="account[0]" class="cursor-pointer border-b border-line hover:bg-muted" @click="userName = account[0]"><td class="p-2">{{ account[0] }}</td><td class="whitespace-nowrap p-2">{{ account[1] }}</td><td class="whitespace-nowrap p-2">{{ account[2] }}</td><td class="p-2 text-secondary">{{ account[3] }}</td></tr></tbody>
      </table>
      <p class="mt-5 text-center text-xs"><router-link to="/" class="text-primary hover:underline">{{ t('public.backHome') }}</router-link></p>
    </div>
  </main>
</template>
