<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { listDepts, createDept, updateDept, deleteDept, listUsers, type SysDept } from '../../../api'
import Modal from '../../../components/Modal.vue'
import { buildTree, flattenTreeWithPrefix, type FlatRow } from '../../../utils/tree'
import { message } from '../../../utils/message'

const query = reactive({ deptName: '', status: '' })
const flat = ref<FlatRow<SysDept>[]>([])
const parentOptions = ref<{ deptId: number; label: string }[]>([])
const expandAll = ref(true)
const users = ref<any[]>([]) // 使用者清單(供負責人下拉,連動部門)

const visibleRows = computed(() => (expandAll.value ? flat.value : flat.value.filter((f) => f.level === 0)))

async function load() {
  const depts = await listDepts({ deptName: query.deptName || undefined, status: query.status || undefined })
  const tree = buildTree(depts, (d) => d.deptId, (d) => d.parentId)
  flat.value = flattenTreeWithPrefix(tree)
  parentOptions.value = flat.value.map((f) => ({ deptId: f.data.deptId, label: `${'　'.repeat(f.level)}${f.data.deptName}` }))
}
onMounted(async () => {
  await load()
  try {
    users.value = (await listUsers({ pageNum: 1, pageSize: 500 })).rows
  } catch { /* 無使用者查詢權限時,負責人退回手動輸入 */ }
})

/** 負責人選項:編輯時優先列出「該部門底下的使用者」;該部門沒人(或新增部門)則列出全部使用者 */
const leaderOptions = computed(() => {
  const inDept = editId.value !== null ? users.value.filter((u) => u.deptId === editId.value) : []
  const list = inDept.length ? inDept : users.value
  const names = [...new Set(list.map((u) => u.nickName as string))]
  if (form.leader && !names.includes(form.leader)) names.unshift(form.leader) // 保留原值(非系統使用者)
  return names
})

function resetQuery() {
  Object.assign(query, { deptName: '', status: '' })
  load()
}

// ---- 新增/修改 ----
const showEdit = ref(false)
const editId = ref<number | null>(null)
const form = reactive({ deptName: '', parentId: 0, orderNum: 0, leader: '', phone: '', email: '', status: '0' })

function openCreate(parentId = 0) {
  editId.value = null
  Object.assign(form, { deptName: '', parentId, orderNum: 0, leader: '', phone: '', email: '', status: '0' })
  showEdit.value = true
}
function openUpdate(d: SysDept) {
  editId.value = d.deptId
  Object.assign(form, {
    deptName: d.deptName, parentId: d.parentId, orderNum: d.orderNum,
    leader: d.leader ?? '', phone: d.phone ?? '', email: d.email ?? '', status: d.status,
  })
  showEdit.value = true
}
async function save() {
  if (editId.value === null) await createDept(form)
  else await updateDept(editId.value, form)
  message('儲存成功')
  showEdit.value = false
  await load()
}
async function onDelete(d: SysDept) {
  if (!confirm(`確定刪除部門「${d.deptName}」嗎?`)) return
  await deleteDept(d.deptId)
  message('刪除成功')
  await load()
}
</script>

<template>
  <div class="rounded bg-card p-5 shadow-sm">
    <!-- 搜尋列 -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 text-[13px] text-secondary">
        部門名稱 <input v-model="query.deptName" type="text" placeholder="請輸入部門名稱" class="w-44 rounded border border-line px-3 py-2 outline-none focus:border-primary" />
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
      <button v-perm="'system:dept:add'" class="rounded bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary-hover" @click="openCreate(0)">＋ 新增</button>
      <button class="rounded border border-line px-3 py-1.5 text-xs text-secondary hover:border-primary hover:bg-muted hover:text-primary" @click="expandAll = !expandAll">⇅ 展開/摺疊</button>
    </div>

    <table class="w-full text-[13px]">
      <thead>
        <tr class="bg-muted text-left text-secondary">
          <th class="px-2.5 py-3 font-medium">部門名稱</th><th class="px-2.5 py-3 font-medium">排序</th>
          <th class="px-2.5 py-3 font-medium">負責人</th><th class="px-2.5 py-3 font-medium">聯絡電話</th>
          <th class="px-2.5 py-3 font-medium">狀態</th><th class="px-2.5 py-3 font-medium">建立時間</th>
          <th class="px-2.5 py-3 font-medium">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in visibleRows" :key="f.data.deptId" class="border-b border-line hover:bg-muted">
          <td class="px-2.5 py-3" :style="{ paddingLeft: `${10 + f.level * 26}px` }">
            <span class="text-disabled">{{ f.prefix }}</span>{{ f.level === 0 ? '🏢 ' : '' }}{{ f.data.deptName }}
          </td>
          <td class="px-2.5 py-3">{{ f.data.orderNum }}</td>
          <td class="px-2.5 py-3">{{ f.data.leader ?? '—' }}</td>
          <td class="px-2.5 py-3">{{ f.data.phone ?? '—' }}</td>
          <td class="px-2.5 py-3">
            <span class="rounded border px-1.5 py-0.5 text-xs" :class="f.data.status === '0' ? 'border-[color-mix(in_srgb,var(--success)_35%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-success' : 'border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger'">
              {{ f.data.status === '0' ? '啟用' : '停用' }}
            </span>
          </td>
          <td class="px-2.5 py-3">{{ f.data.createTime?.slice(0, 10) }}</td>
          <td class="px-2.5 py-3 whitespace-nowrap">
            <button v-perm="'system:dept:edit'" class="px-1.5 text-primary hover:underline" @click="openUpdate(f.data)">修改</button>
            <button v-perm="'system:dept:add'" class="px-1.5 text-primary hover:underline" @click="openCreate(f.data.deptId)">新增</button>
            <button v-if="f.data.parentId !== 0" v-perm="'system:dept:remove'" class="px-1.5 text-danger hover:underline" @click="onDelete(f.data)">刪除</button>
          </td>
        </tr>
        <tr v-if="!visibleRows.length"><td colspan="7" class="py-10 text-center text-disabled">無資料</td></tr>
      </tbody>
    </table>

    <!-- 新增/修改部門 Modal -->
    <Modal :show="showEdit" :title="editId === null ? '新增部門' : '修改部門'" @close="showEdit = false" @confirm="save">
      <div class="grid grid-cols-2 gap-4 text-[13px]">
        <div class="col-span-2">
          <label class="mb-1.5 block text-secondary"><span class="text-danger">*</span> 上層部門</label>
          <select v-model="form.parentId" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary">
            <option :value="0">無(根部門)</option>
            <option v-for="p in parentOptions" :key="p.deptId" :value="p.deptId">{{ p.label }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-secondary"><span class="text-danger">*</span> 部門名稱</label>
          <input v-model="form.deptName" type="text" placeholder="請輸入部門名稱" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label class="mb-1.5 block text-secondary">顯示排序</label>
          <input v-model.number="form.orderNum" type="number" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label class="mb-1.5 block text-secondary">負責人</label>
          <!-- 有使用者資料 → 下拉(連動部門使用者);否則退回手動輸入 -->
          <select v-if="users.length" v-model="form.leader" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary">
            <option value="">—</option>
            <option v-for="n in leaderOptions" :key="n" :value="n">{{ n }}</option>
          </select>
          <input v-else v-model="form.leader" type="text" placeholder="請輸入負責人" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label class="mb-1.5 block text-secondary">聯絡電話</label>
          <input v-model="form.phone" type="text" placeholder="請輸入聯絡電話" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label class="mb-1.5 block text-secondary">Email</label>
          <input v-model="form.email" type="text" placeholder="請輸入 Email" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label class="mb-1.5 block text-secondary">部門狀態</label>
          <div class="flex gap-4 pt-2">
            <label class="flex items-center gap-1.5"><input v-model="form.status" type="radio" value="0" class="accent-primary" /> 啟用</label>
            <label class="flex items-center gap-1.5"><input v-model="form.status" type="radio" value="1" class="accent-primary" /> 停用</label>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>
