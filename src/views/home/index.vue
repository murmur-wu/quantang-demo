<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LocaleSwitcher from '../../components/LocaleSwitcher.vue'
import { useAuthStore } from '../../stores/auth'
// 作品說明首頁:純靜態,不呼叫 API,後端離線時也看得到。
const auth = useAuthStore()
const { t } = useI18n()
const stack = computed(() => [
  [t('public.backend'), '.NET 10、ASP.NET Core Web API、EF Core、SQLite'],
  [t('public.frontend'), 'Vue 3、TypeScript、Vite、Pinia、Tailwind CSS'],
  [t('public.loginStack'), t('public.loginStackText')],
  [t('public.deployment'), t('public.deployText')],
])
const points = computed(() => [
  [t('public.pointScope'), t('public.pointScopeText')],
  [t('public.pointStatus'), t('public.pointStatusText')],
  [t('public.pointBackend'), t('public.pointBackendText')],
  [t('public.pointCsrf'), t('public.pointCsrfText')],
  [t('public.pointLogout'), t('public.pointLogoutText')],
  [t('public.pointReset'), t('public.pointResetText')],
])
const accounts = computed(() => [
  [t('public.adminRole'), t('public.adminScope')],
  [t('public.leadRole'), t('public.leadScope')],
  [t('public.ownerRole'), t('public.ownerScope')],
  [t('public.advisorRole'), t('public.advisorScope')],
  [t('public.guestRole'), t('public.guestScope')],
])
</script>
<template>
  <div class="fixed right-4 top-4 z-40"><LocaleSwitcher /></div>
  <main class="min-h-screen bg-body text-main">
    <div class="mx-auto max-w-4xl px-5 py-12">
      <header class="rounded-lg bg-gradient-to-br from-[#304156] to-[#263445] p-8 text-white">
        <p class="text-sm opacity-80">{{ t('public.portfolio') }}</p>
        <h1 class="mt-1 text-3xl font-semibold">權糖 quantang</h1>
        <p class="mt-3 max-w-2xl leading-relaxed opacity-90">
          {{ t('public.intro') }}
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <router-link v-if="auth.isLoggedIn" to="/dashboard" class="rounded bg-primary px-5 py-2.5 font-medium text-white">{{ t('public.enterDashboard') }}</router-link>
          <router-link v-else to="/login" class="rounded bg-primary px-5 py-2.5 font-medium text-white">{{ t('public.demoLogin') }}</router-link>
        </div>
      </header>

      <section class="mt-8 rounded bg-card p-6 shadow-sm">
        <h2 class="text-lg font-semibold">{{ t('public.explains') }}</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div v-for="p in points" :key="p[0]" class="rounded border border-line p-4">
            <h3 class="font-medium">{{ p[0] }}</h3>
            <p class="mt-1 text-sm leading-relaxed text-secondary">{{ p[1] }}</p>
          </div>
        </div>
      </section>

      <section class="mt-6 rounded bg-card p-6 shadow-sm">
        <h2 class="text-lg font-semibold">{{ t('public.try') }}</h2>
        <p class="mt-2 text-sm text-secondary">{{ t('public.tryText') }}</p>
        <table class="mt-4 w-full text-left text-sm">
          <thead><tr class="bg-muted"><th class="p-3">{{ t('public.role') }}</th><th class="p-3">{{ t('public.visibleAfterLogin') }}</th></tr></thead>
          <tbody><tr v-for="a in accounts" :key="a[0]" class="border-b border-line"><td class="whitespace-nowrap p-3 font-medium">{{ a[0] }}</td><td class="p-3 text-secondary">{{ a[1] }}</td></tr></tbody>
        </table>
      </section>

      <section class="mt-6 rounded bg-card p-6 shadow-sm">
        <h2 class="text-lg font-semibold">{{ t('public.stack') }}</h2>
        <dl class="mt-4 space-y-2 text-sm">
          <div v-for="s in stack" :key="s[0]" class="flex gap-4"><dt class="w-28 shrink-0 font-medium">{{ s[0] }}</dt><dd class="text-secondary">{{ s[1] }}</dd></div>
        </dl>
        <p class="mt-4 text-sm text-secondary">{{ t('public.stackNote') }}</p>
      </section>

      <section class="mt-6 rounded border border-line p-6 text-sm leading-relaxed text-secondary">
        <h2 class="text-base font-semibold text-main">{{ t('public.beforeUse') }}</h2>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li>{{ t('public.noticeOffline') }}</li>
          <li>{{ t('public.noticeReset') }}</li>
          <li>{{ t('public.noticePrivacy') }}</li>
        </ul>
      </section>
    </div>
  </main>
</template>
