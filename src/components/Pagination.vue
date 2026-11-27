<script setup lang="ts">
// 數字分頁(照 prototype .pagination 樣式)
import { computed } from 'vue'

const props = defineProps<{ total: number; pageNum: number; pageSize: number }>()
const emit = defineEmits<{ change: [page: number] }>()

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

/** 頁碼清單,過多時以 … 省略 */
const pages = computed<(number | '…')[]>(() => {
  const n = pageCount.value
  const cur = props.pageNum
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1)
  const set = new Set<number>([1, 2, cur - 1, cur, cur + 1, n - 1, n].filter((p) => p >= 1 && p <= n))
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) out.push('…')
    out.push(p)
    prev = p
  }
  return out
})

function go(p: number) {
  if (p >= 1 && p <= pageCount.value && p !== props.pageNum) emit('change', p)
}
</script>

<template>
  <div class="mt-4 flex items-center justify-end gap-1.5 text-[13px] text-secondary">
    <span class="mr-1">{{ $t('ui.total', { count: total }) }}</span>
    <button class="flex h-7 min-w-7 items-center justify-center rounded bg-muted hover:bg-line" :aria-label="$t('ui.previous')" @click="go(pageNum - 1)">‹</button>
    <template v-for="(p, i) in pages" :key="i">
      <span v-if="p === '…'" class="px-1">…</span>
      <button
        v-else
        class="flex h-7 min-w-7 items-center justify-center rounded"
        :class="p === pageNum ? 'bg-primary text-white' : 'bg-muted hover:bg-line'"
        @click="go(p)"
      >{{ p }}</button>
    </template>
    <button class="flex h-7 min-w-7 items-center justify-center rounded bg-muted hover:bg-line" :aria-label="$t('ui.next')" @click="go(pageNum + 1)">›</button>
  </div>
</template>
