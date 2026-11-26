<script setup lang="ts">
// 部門樹(照 prototype users.html 左側 .tree 樣式),點選節點篩選
import type { SysDept } from '../api'
import type { TreeNode } from '../utils/tree'

const props = defineProps<{
  nodes: TreeNode<SysDept>[]
  selected: number | null
  expanded: Set<number>
}>()
const emit = defineEmits<{ select: [id: number] }>()

function toggleExpand(node: TreeNode<SysDept>) {
  if (props.expanded.has(node.data.deptId)) props.expanded.delete(node.data.deptId)
  else props.expanded.add(node.data.deptId)
}
</script>

<template>
  <ul class="select-none text-[13px]">
    <li v-for="node in nodes" :key="node.data.deptId" class="my-0.5">
      <div
        class="flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-[5px] hover:bg-muted"
        :class="{ 'bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary': selected === node.data.deptId }"
        @click="emit('select', node.data.deptId)"
      >
        <span
          class="w-3.5 shrink-0 text-[11px] text-disabled"
          @click.stop="toggleExpand(node)"
        >{{ node.children.length ? (expanded.has(node.data.deptId) ? '▾' : '▸') : '' }}</span>
        <span v-if="node.children.length" class="text-warning">🏢</span>
        {{ node.data.deptName }}
      </div>
      <div v-if="node.children.length && expanded.has(node.data.deptId)" class="pl-[22px]">
        <DeptTree :nodes="node.children" :selected="selected" :expanded="expanded" @select="(id) => emit('select', id)" />
      </div>
    </li>
  </ul>
</template>
