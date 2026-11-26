<script setup lang="ts">
// 狀態開關(照 prototype .switch 樣式);on = status "0"
defineProps<{ on: boolean; disabled?: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <span
    class="relative inline-block h-5 w-10 rounded-full align-middle transition-colors"
    :class="[on ? 'bg-primary' : 'bg-gray-300', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer']"
    @click="!disabled && emit('toggle')"
  >
    <span
      class="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
      :class="on ? 'left-[22px]' : 'left-0.5'"
    ></span>
  </span>
</template>
