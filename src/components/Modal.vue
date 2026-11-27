<script setup lang="ts">
defineProps<{ show: boolean; title: string; width?: string }>()
const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[8vh]">
    <div class="flex max-h-[82vh] flex-col rounded-md bg-card shadow-xl" :style="{ width: width || '640px', maxWidth: '94vw' }">
      <div class="flex items-center justify-between border-b border-line px-5 py-4">
        <h4 class="text-[15px] font-semibold text-main">{{ title }}</h4>
        <button class="text-disabled hover:text-secondary" @click="emit('close')">✕</button>
      </div>
      <div class="overflow-y-auto p-5">
        <slot />
      </div>
      <div class="flex justify-end gap-2 border-t border-line px-5 py-3">
        <button class="rounded border border-line px-4 py-2 text-sm text-secondary hover:bg-muted" @click="emit('close')">{{ $t('common.cancel') }}</button>
        <button class="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover" @click="emit('confirm')">{{ $t('common.confirm') }}</button>
      </div>
    </div>
  </div>
</template>
