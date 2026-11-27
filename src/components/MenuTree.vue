<script setup lang="ts">
import { menuLabel } from '../i18n/labels'
// 遞迴選單權限樹節點(照 prototype/roles.html 權限設定樣式)
import type { SysMenu } from '../api'
import type { TreeNode } from '../utils/tree'

const props = defineProps<{
  nodes: TreeNode<SysMenu>[]
  checked: Set<number>
  expanded: Set<number>
  cascade: boolean
}>()
const emit = defineEmits<{ change: [] }>()

const icons: Record<string, string> = {
  dashboard: '📊', system: '⚙️', user: '👤', role: '🛡️', menu: '📋', dept: '🏢',
}

function collectIds(node: TreeNode<SysMenu>): number[] {
  return [node.data.menuId, ...node.children.flatMap(collectIds)]
}

function toggle(node: TreeNode<SysMenu>, on: boolean) {
  const ids = props.cascade ? collectIds(node) : [node.data.menuId]
  for (const id of ids) {
    if (on) props.checked.add(id)
    else props.checked.delete(id)
  }
  emit('change')
}

function toggleExpand(node: TreeNode<SysMenu>) {
  if (props.expanded.has(node.data.menuId)) props.expanded.delete(node.data.menuId)
  else props.expanded.add(node.data.menuId)
}

/** 部分子孫勾選 → 半選 */
function isIndeterminate(node: TreeNode<SysMenu>): boolean {
  if (!node.children.length || !props.cascade) return false
  const ids = node.children.flatMap(collectIds)
  const n = ids.filter((id) => props.checked.has(id)).length
  return n > 0 && n < ids.length
}
</script>

<template>
  <ul class="select-none">
    <li v-for="node in nodes" :key="node.data.menuId" class="my-0.5">
      <div class="flex items-center gap-1.5 rounded px-1.5 py-[5px] text-[13px] hover:bg-muted">
        <!-- 展開/摺疊箭頭 -->
        <span
          class="w-3.5 shrink-0 cursor-pointer text-[11px] text-disabled"
          @click="toggleExpand(node)"
        >{{ node.children.length ? (expanded.has(node.data.menuId) ? '▾' : '▸') : '' }}</span>

        <label class="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            class="h-[15px] w-[15px] accent-primary"
            :checked="checked.has(node.data.menuId)"
            :indeterminate="isIndeterminate(node)"
            @change="toggle(node, ($event.target as HTMLInputElement).checked)"
          />
          <!-- 按鈕:灰色標籤;頂層目錄/選單:圖示 -->
          <span
            v-if="node.data.menuType === 'F'"
            class="rounded border border-line bg-muted px-2 py-0.5 text-[12px] text-secondary"
          >{{ $t('tree.button') }}</span>
          <span v-else-if="node.data.parentId === 0">{{ icons[node.data.icon ?? ''] ?? '' }}</span>
          {{ menuLabel(node.data) }}
        </label>
      </div>
      <div v-if="node.children.length && expanded.has(node.data.menuId)" class="pl-[22px]">
        <MenuTree :nodes="node.children" :checked="checked" :expanded="expanded" :cascade="cascade" @change="emit('change')" />
      </div>
    </li>
  </ul>
</template>
