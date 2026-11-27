<script setup lang="ts">
// 權限樹面板:工具列(展開/摺疊、全選/全不選、父子連動)+ 樹(照 prototype)
import { reactive, ref, watch } from 'vue'
import type { SysMenu } from '../api'
import type { TreeNode } from '../utils/tree'
import MenuTree from './MenuTree.vue'

const props = defineProps<{ nodes: TreeNode<SysMenu>[]; checked: Set<number> }>()

const expanded = reactive(new Set<number>())
const expandAll = ref(true)
const selectAll = ref(false)
const cascade = ref(true)

function parentIds(nodes: TreeNode<SysMenu>[]): number[] {
  return nodes.flatMap((n) => (n.children.length ? [n.data.menuId, ...parentIds(n.children)] : []))
}
function allIds(nodes: TreeNode<SysMenu>[]): number[] {
  return nodes.flatMap((n) => [n.data.menuId, ...allIds(n.children)])
}

// 樹載入後預設全部展開
watch(
  () => props.nodes,
  (nodes) => {
    expanded.clear()
    if (expandAll.value) for (const id of parentIds(nodes)) expanded.add(id)
  },
  { immediate: true },
)

function onExpandAll() {
  expanded.clear()
  if (expandAll.value) for (const id of parentIds(props.nodes)) expanded.add(id)
}

function onSelectAll() {
  props.checked.clear()
  if (selectAll.value) for (const id of allIds(props.nodes)) props.checked.add(id)
}

/** 父子連動:由下往上修正 — 有子孫勾選則父層必勾,全空則取消(並更新半選) */
function fixUp(nodes: TreeNode<SysMenu>[]): boolean {
  let any = false
  for (const n of nodes) {
    const childAny = fixUp(n.children)
    if (n.children.length) {
      if (childAny) props.checked.add(n.data.menuId)
      else props.checked.delete(n.data.menuId)
    }
    any = any || props.checked.has(n.data.menuId)
  }
  return any
}

function onChange() {
  if (cascade.value) fixUp(props.nodes)
}
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center gap-4 text-[13px] text-secondary">
      <label class="flex cursor-pointer items-center gap-1.5">
        <input v-model="expandAll" type="checkbox" class="accent-primary" @change="onExpandAll" /> {{ $t('tree.expandCollapse') }}
      </label>
      <label class="flex cursor-pointer items-center gap-1.5">
        <input v-model="selectAll" type="checkbox" class="accent-primary" @change="onSelectAll" /> {{ $t('tree.selectAll') }}
      </label>
      <label class="flex cursor-pointer items-center gap-1.5">
        <input v-model="cascade" type="checkbox" class="accent-primary" /> {{ $t('tree.cascade') }}
      </label>
    </div>
    <div class="max-h-[380px] overflow-y-auto rounded border border-line p-2.5">
      <MenuTree :nodes="nodes" :checked="checked" :expanded="expanded" :cascade="cascade" @change="onChange" />
    </div>
  </div>
</template>
