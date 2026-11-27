<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LocaleSwitcher from '../../components/LocaleSwitcher.vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
const { t } = useI18n()
const route = useRoute(), router = useRouter()
const auth = useAuthStore()
// 被擋下的原始路徑,只用來顯示,不會自動重試。
const from = computed(() => (typeof route.query.from === 'string' ? route.query.from : ''))
</script>
<template>
  <div class="fixed right-4 top-4 z-40"><LocaleSwitcher /></div>
  <div class="flex min-h-[60vh] items-center justify-center">
    <div class="w-full max-w-md rounded bg-card p-8 text-center shadow-sm">
      <p class="text-5xl font-bold text-primary">403</p>
      <h1 class="mt-3 text-lg font-semibold">{{ t('errors.FORBIDDEN') }}</h1>
      <p class="mt-2 text-secondary">
        {{ t('public.forbiddenText', { name: auth.user?.nickName ?? t('public.unknown') }) }}
      </p>
      <p v-if="from" class="mt-2 break-all text-xs text-disabled">{{ t('public.deniedPath', { path: from }) }}</p>
      <p class="mt-2 text-xs text-disabled">{{ t('public.forbiddenHint') }}</p>
      <div class="mt-6 flex justify-center gap-3">
        <button class="rounded bg-primary px-4 py-2 text-white" @click="router.replace('/dashboard')">{{ t('public.backDashboard') }}</button>
        <button class="rounded border border-line px-4 py-2 hover:text-primary" @click="router.replace('/work')">{{ t('public.work') }}</button>
      </div>
    </div>
  </div>
</template>
