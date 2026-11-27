<script setup lang="ts">
import { i18n, setLocale, isAppLocale } from '../i18n'
import { useThemeStore } from '../stores/theme'
import { useAuthStore } from '../stores/auth'

function change(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (!isAppLocale(value)) return
  setLocale(value)
  if (useAuthStore().isLoggedIn) useThemeStore().set({ locale: value })
}
</script>
<template>
  <select :value="i18n.global.locale.value" :aria-label="$t('common.language')" class="rounded border border-line bg-card px-2 py-1 text-main" @change="change">
    <option value="zh-TW">繁體中文</option><option value="en">English</option><option value="ja">日本語</option><option value="zh-CN">简体中文</option>
  </select>
</template>
