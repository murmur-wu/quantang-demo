<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { listMenus, createMenu, updateMenu, deleteMenu, type SysMenu } from '../../../api'
import Modal from '../../../components/Modal.vue'
import { buildTree, flattenTreeWithPrefix, type FlatRow } from '../../../utils/tree'
import { message } from '../../../utils/message'

const query = reactive({ menuName: '', status: '' })
const flat = ref<FlatRow<SysMenu>[]>([])
const parentOptions = ref<{ menuId: number; label: string }[]>([])
const expandAll = ref(true)

const visibleRows = computed(() => (expandAll.value ? flat.value : flat.value.filter((f) => f.level === 0)))

async function load() {
  const menus = await listMenus({ menuName: query.menuName || undefined, status: query.status || undefined })
  const tree = buildTree(menus, (m) => m.menuId, (m) => m.parentId)
  flat.value = flattenTreeWithPrefix(tree)
  parentOptions.value = flat.value
    .filter((f) => f.data.menuType !== 'F')
    .map((f) => ({ menuId: f.data.menuId, label: `${'　'.repeat(f.level)}${f.data.menuName}` }))
}
onMounted(load)

function resetQuery() {
  Object.assign(query, { menuName: '', status: '' })
  load()
}

const typeLabel: Record<string, string> = { M: '目錄', C: '選單', F: '按鈕' }

// ---- 新增/修改 ----
const showEdit = ref(false)
const editId = ref<number | null>(null)
const form = reactive({
  menuName: '', parentId: 0, orderNum: 0, path: '', component: '',
  menuType: 'C', visible: '0', status: '0', perms: '', icon: '',
})

function openCreate(parentId = 0) {
  editId.value = null
  Object.assign(form, { menuName: '', parentId, orderNum: 0, path: '', component: '', menuType: parentId ? 'C' : 'M', visible: '0', status: '0', perms: '', icon: '' })
  showEdit.value = true
}
function openUpdate(m: SysMenu) {
  editId.value = m.menuId
  Object.assign(form, {
    menuName: m.menuName, parentId: m.parentId, orderNum: m.orderNum,
    path: m.path ?? '', component: m.component ?? '', menuType: m.menuType,
    visible: m.visible, status: m.status, perms: m.perms ?? '', icon: m.icon ?? '',
  })
  showEdit.value = true
}
async function save() {
  if (editId.value === null) await createMenu(form)
  else await updateMenu(editId.value, form)
  message('儲存成功')
  showEdit.value = false
  await load()
}
async function onDelete(m: SysMenu) {
  if (!confirm(`確定刪除選單「${m.menuName}」嗎?`)) return
  await deleteMenu(m.menuId)
  message('刪除成功')
  await load()
}
</script>

<template>
  <div class="rounded bg-card p-5 shadow-sm">
    <!-- 搜尋列 -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 text-[13px] text-secondary">
        選單名稱 <input v-model="query.menuName" type="text" placeholder="請輸入選單名稱" class="w-44 rounded border border-line px-3 py-2 outline-none focus:border-primary" />
      </label>
      <label class="flex items-center gap-2 text-[13px] text-secondary">
        狀態
        <select v-model="query.status" class="rounded border border-line px-3 py-2 outline-none focus:border-primary">
          <option value="">全部</option><option value="0">啟用</option><option value="1">停用</option>
        </select>
      </label>
      <button class="rounded bg-primary px-3 py-2 text-xs text-white hover:bg-primary-hover" @click="load">🔍 搜尋</button>
      <button class="rounded border border-line px-3 py-2 text-xs text-secondary hover:border-primary hover:bg-muted hover:text-primary" @click="resetQuery">重設</button>
    </div>

    <!-- 工具列 -->
    <div class="mb-4 flex gap-2">
      <button v-perm="'system:menu:add'" class="rounded bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary-hover" @click="openCreate(0)">＋ 新增</button>
      <button class="rounded border border-line px-3 py-1.5 text-xs text-secondary hover:border-primary hover:bg-muted hover:text-primary" @click="expandAll = !expandAll">⇅ 展開/摺疊</button>
    </div>

    <table class="w-full text-[13px]">
      <thead>
        <tr class="bg-muted text-left text-secondary">
          <th class="px-2.5 py-3 font-medium">選單名稱</th><th class="px-2.5 py-3 font-medium">圖示</th>
          <th class="px-2.5 py-3 font-medium">排序</th><th class="px-2.5 py-3 font-medium">權限識別</th>
          <th class="px-2.5 py-3 font-medium">元件路徑</th><th class="px-2.5 py-3 font-medium">類型</th>
          <th class="px-2.5 py-3 font-medium">狀態</th><th class="px-2.5 py-3 font-medium">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in visibleRows" :key="f.data.menuId" class="border-b border-line hover:bg-muted">
          <td class="px-2.5 py-3" :style="{ paddingLeft: `${10 + f.level * 26}px` }">
            <span class="text-disabled">{{ f.prefix }}</span>{{ f.data.menuName }}
          </td>
          <td class="px-2.5 py-3">{{ f.data.icon || '—' }}</td>
          <td class="px-2.5 py-3">{{ f.data.orderNum }}</td>
          <td class="px-2.5 py-3 font-mono text-xs">{{ f.data.perms ?? '—' }}</td>
          <td class="px-2.5 py-3 font-mono text-xs">{{ f.data.component ?? '—' }}</td>
          <td class="px-2.5 py-3">
            <span class="rounded border px-1.5 py-0.5 text-xs" :class="{
              'border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-warning': f.data.menuType === 'M',
              'border-[color-mix(in_srgb,var(--info)_35%,transparent)] bg-[color-mix(in_srgb,var(--info)_12%,transparent)] text-info': f.data.menuType === 'C',
              'border-line bg-muted text-secondary': f.data.menuType === 'F',
            }">{{ typeLabel[f.data.menuType] }}</span>
          </td>
          <td class="px-2.5 py-3">
            <span class="rounded border px-1.5 py-0.5 text-xs" :class="f.data.status === '0' ? 'border-[color-mix(in_srgb,var(--success)_35%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-success' : 'border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger'">
              {{ f.data.status === '0' ? '啟用' : '停用' }}
            </span>
          </td>
          <td class="px-2.5 py-3 whitespace-nowrap">
            <button v-perm="'system:menu:edit'" class="px-1.5 text-primary hover:underline" @click="openUpdate(f.data)">修改</button>
            <button v-if="f.data.menuType !== 'F'" v-perm="'system:menu:add'" class="px-1.5 text-primary hover:underline" @click="openCreate(f.data.menuId)">新增</button>
            <button v-perm="'system:menu:remove'" class="px-1.5 text-danger hover:underline" @click="onDelete(f.data)">刪除</button>
          </td>
        </tr>
        <tr v-if="!visibleRows.length"><td colspan="8" class="py-10 text-center text-disabled">無資料</td></tr>
      </tbody>
    </table>

    <!-- 新增/修改選單 Modal -->
    <Modal :show="showEdit" :title="editId === null ? '新增選單' : '修改選單'" @close="showEdit = false" @confirm="save">
      <div class="grid grid-cols-2 gap-4 text-[13px]">
        <div class="col-span-2">
          <label class="mb-1.5 block text-secondary">上層選單</label>
          <select v-model="form.parentId" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary">
            <option :value="0">主目錄</option>
            <option v-for="p in parentOptions" :key="p.menuId" :value="p.menuId">{{ p.label }}</option>
          </select>
        </div>
        <div class="col-span-2">
          <label class="mb-1.5 block text-secondary"><span class="text-danger">*</span> 選單類型</label>
          <div class="flex gap-4 pt-1">
            <label class="flex items-center gap-1.5"><input v-model="form.menuType" type="radio" value="M" class="accent-primary" /> 目錄</label>
            <label class="flex items-center gap-1.5"><input v-model="form.menuType" type="radio" value="C" class="accent-primary" /> 選單</label>
            <label class="flex items-center gap-1.5"><input v-model="form.menuType" type="radio" value="F" class="accent-primary" /> 按鈕</label>
          </div>
        </div>
        <div>
          <label class="mb-1.5 block text-secondary"><span class="text-danger">*</span> 選單名稱</label>
          <input v-model="form.menuName" type="text" placeholder="請輸入選單名稱" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label class="mb-1.5 block text-secondary">顯示排序</label>
          <input v-model.number="form.orderNum" type="number" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <template v-if="form.menuType !== 'F'">
          <div>
            <label class="mb-1.5 block text-secondary">選單圖示</label>
            <input v-model="form.icon" type="text" placeholder="請選擇圖示" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1.5 block text-secondary">路由位址</label>
            <input v-model="form.path" type="text" placeholder="例如: /system/user" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
          </div>
        </template>
        <div v-if="form.menuType === 'C'">
          <label class="mb-1.5 block text-secondary">元件路徑</label>
          <input v-model="form.component" type="text" placeholder="例如: system/user/index" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div v-if="form.menuType !== 'M'">
          <label class="mb-1.5 block text-secondary">權限識別</label>
          <input v-model="form.perms" type="text" placeholder="例如: system:user:list" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div v-if="form.menuType !== 'F'">
          <label class="mb-1.5 block text-secondary">顯示狀態</label>
          <div class="flex gap-4 pt-2">
            <label class="flex items-center gap-1.5"><input v-model="form.visible" type="radio" value="0" class="accent-primary" /> 顯示</label>
            <label class="flex items-center gap-1.5"><input v-model="form.visible" type="radio" value="1" class="accent-primary" /> 隱藏</label>
          </div>
        </div>
        <div>
          <label class="mb-1.5 block text-secondary">選單狀態</label>
          <div class="flex gap-4 pt-2">
            <label class="flex items-center gap-1.5"><input v-model="form.status" type="radio" value="0" class="accent-primary" /> 啟用</label>
            <label class="flex items-center gap-1.5"><input v-model="form.status" type="radio" value="1" class="accent-primary" /> 停用</label>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>
