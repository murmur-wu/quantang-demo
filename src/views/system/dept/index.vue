<script setup lang="ts">
import { formatDate } from '../../../i18n/format'
import { useConfirm } from '../../../utils/confirm'
import { useI18n } from 'vue-i18n'

import { computed, onMounted, reactive, ref } from 'vue'
import { listDepts, createDept, updateDept, deleteDept, listUsers, type SysDept } from '../../../api'
import Modal from '../../../components/Modal.vue'
import { buildTree, flattenTreeWithPrefix, type FlatRow } from '../../../utils/tree'
import { message } from '../../../utils/message'

const { t } = useI18n()

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
  message(t('system.saved'))
  showEdit.value = false
  await load()
}
async function onDelete(d: SysDept) {
  if (!await useConfirm(t('confirm.deleteDept', { name: d.deptName }))) return
  await deleteDept(d.deptId)
  message(t('system.deleted'))
  await load()
}
</script>

<template>
  <div class="rounded bg-card p-5 shadow-sm">
    <!-- 搜尋列 -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 text-[13px] text-secondary">
        {{ t('tree.deptName') }} <input v-model="query.deptName" type="text" :placeholder="t('tree.enterDept')" class="w-44 rounded border border-line px-3 py-2 outline-none focus:border-primary" />
      </label>
      <label class="flex items-center gap-2 text-[13px] text-secondary">
        {{ t('system.status') }}
        <select v-model="query.status" class="rounded border border-line px-3 py-2 outline-none focus:border-primary">
          <option value="">{{ t('system.all') }}</option><option value="0">{{ t('system.enabled') }}</option><option value="1">{{ t('system.disabled') }}</option>
        </select>
      </label>
      <button class="rounded bg-primary px-3 py-2 text-xs text-white hover:bg-primary-hover" @click="load">🔍 {{ t('system.search') }}</button>
      <button class="rounded border border-line px-3 py-2 text-xs text-secondary hover:border-primary hover:bg-muted hover:text-primary" @click="resetQuery">{{ t('system.reset') }}</button>
    </div>

    <!-- 工具列 -->
    <div class="mb-4 flex gap-2">
      <button v-perm="'system:dept:add'" class="rounded bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary-hover" @click="openCreate(0)">＋ {{ t('system.add') }}</button>
      <button class="rounded border border-line px-3 py-1.5 text-xs text-secondary hover:border-primary hover:bg-muted hover:text-primary" @click="expandAll = !expandAll">⇅ {{ t('tree.expandCollapse') }}</button>
    </div>

    <table class="w-full text-[13px]">
      <thead>
        <tr class="bg-muted text-left text-secondary">
          <th class="px-2.5 py-3 font-medium">{{ t('tree.deptName') }}</th><th class="px-2.5 py-3 font-medium">{{ t('tree.order') }}</th>
          <th class="px-2.5 py-3 font-medium">{{ t('tree.leader') }}</th><th class="px-2.5 py-3 font-medium">{{ t('tree.contactPhone') }}</th>
          <th class="px-2.5 py-3 font-medium">{{ t('system.status') }}</th><th class="px-2.5 py-3 font-medium">{{ t('system.createdAt') }}</th>
          <th class="px-2.5 py-3 font-medium">{{ t('system.actions') }}</th>
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
              {{ f.data.status === '0' ? t('system.enabled') : t('system.disabled') }}
            </span>
          </td>
          <td class="px-2.5 py-3">{{ f.data.createTime ? formatDate(f.data.createTime) : '' }}</td>
          <td class="px-2.5 py-3 whitespace-nowrap">
            <button v-perm="'system:dept:edit'" class="px-1.5 text-primary hover:underline" @click="openUpdate(f.data)">{{ t('system.edit') }}</button>
            <button v-perm="'system:dept:add'" class="px-1.5 text-primary hover:underline" @click="openCreate(f.data.deptId)">{{ t('system.add') }}</button>
            <button v-if="f.data.parentId !== 0" v-perm="'system:dept:remove'" class="px-1.5 text-danger hover:underline" @click="onDelete(f.data)">{{ t('system.delete') }}</button>
          </td>
        </tr>
        <tr v-if="!visibleRows.length"><td colspan="7" class="py-10 text-center text-disabled">{{ t('system.noData') }}</td></tr>
      </tbody>
    </table>

    <!-- 新增/修改部門 Modal -->
    <Modal :show="showEdit" :title="editId === null ? t('tree.addDept') : t('tree.editDept')" @close="showEdit = false" @confirm="save">
      <div class="grid grid-cols-2 gap-4 text-[13px]">
        <div class="col-span-2">
          <label class="mb-1.5 block text-secondary"><span class="text-danger">*</span> {{ t('tree.parentDept') }}</label>
          <select v-model="form.parentId" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary">
            <option :value="0">{{ t('tree.rootDept') }}</option>
            <option v-for="p in parentOptions" :key="p.deptId" :value="p.deptId">{{ p.label }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-secondary"><span class="text-danger">*</span> {{ t('tree.deptName') }}</label>
          <input v-model="form.deptName" type="text" :placeholder="t('tree.enterDept')" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label class="mb-1.5 block text-secondary">{{ t('tree.displayOrder') }}</label>
          <input v-model.number="form.orderNum" type="number" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label class="mb-1.5 block text-secondary">{{ t('tree.leader') }}</label>
          <!-- 有使用者資料 → 下拉(連動部門使用者);否則退回手動輸入 -->
          <select v-if="users.length" v-model="form.leader" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary">
            <option value="">—</option>
            <option v-for="n in leaderOptions" :key="n" :value="n">{{ n }}</option>
          </select>
          <input v-else v-model="form.leader" type="text" :placeholder="t('tree.enterLeader')" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label class="mb-1.5 block text-secondary">{{ t('tree.contactPhone') }}</label>
          <input v-model="form.phone" type="text" :placeholder="t('tree.enterContactPhone')" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label class="mb-1.5 block text-secondary">Email</label>
          <input v-model="form.email" type="text" :placeholder="t('system.enterEmail')" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label class="mb-1.5 block text-secondary">{{ t('tree.deptStatus') }}</label>
          <div class="flex gap-4 pt-2">
            <label class="flex items-center gap-1.5"><input v-model="form.status" type="radio" value="0" class="accent-primary" /> {{ t('system.enabled') }}</label>
            <label class="flex items-center gap-1.5"><input v-model="form.status" type="radio" value="1" class="accent-primary" /> {{ t('system.disabled') }}</label>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>
