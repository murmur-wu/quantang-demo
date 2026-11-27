<script setup lang="ts">
import { roleLabel } from '../../../i18n/labels'
import { formatDate } from '../../../i18n/format'
import { useConfirm } from '../../../utils/confirm'
import { useI18n } from 'vue-i18n'

import { computed, onMounted, reactive, ref } from 'vue'
import {
  listUsers, createUser, updateUser, deleteUser, resetPassword,
  listRoles, listDepts, type SysDept,
} from '../../../api'
import Modal from '../../../components/Modal.vue'
import Switch from '../../../components/Switch.vue'
import Pagination from '../../../components/Pagination.vue'
import DeptTree from '../../../components/DeptTree.vue'
import { buildTree, flattenTree, pruneTree, type TreeNode } from '../../../utils/tree'
import { message } from '../../../utils/message'

const { t } = useI18n()

const query = reactive({ userName: '', phone: '', status: '', deptId: null as number | null, pageNum: 1, pageSize: 10 })
const rows = ref<any[]>([])
const total = ref(0)
const selected = ref(new Set<number>())
const demoAccounts = new Set([
  'admin@quantang.demo', 'east.lead@quantang.demo', 'west.lead@quantang.demo',
  'owner@quantang.demo', 'advisor@quantang.demo', 'guest@quantang.demo',
])

// ---- 部門樹(左側) ----
const deptFilter = ref('')
const deptTree = ref<TreeNode<SysDept>[]>([])
const deptExpanded = reactive(new Set<number>())
const deptOptions = ref<{ deptId: number; label: string }[]>([])
const roleOptions = ref<any[]>([])

const visibleDeptTree = computed(() =>
  deptFilter.value ? pruneTree(deptTree.value, (d) => d.deptName.includes(deptFilter.value)) : deptTree.value,
)

function onSelectDept(id: number) {
  query.deptId = query.deptId === id ? null : id // 再點一次取消篩選
  goPage(1)
}

async function load() {
  const res = await listUsers({
    ...query,
    userName: query.userName || undefined,
    phone: query.phone || undefined,
    status: query.status || undefined,
    deptId: query.deptId ?? undefined,
  })
  rows.value = res.rows
  total.value = res.total
  selected.value.clear()
}

function resetQuery() {
  Object.assign(query, { userName: '', phone: '', status: '', deptId: null, pageNum: 1 })
  load()
}

onMounted(async () => {
  await load()
  try {
    const depts = await listDepts()
    deptTree.value = buildTree<SysDept>(depts, (d) => d.deptId, (d) => d.parentId)
    for (const d of depts) deptExpanded.add(d.deptId) // 預設全展開
    deptOptions.value = flattenTree(deptTree.value)
      .map((f) => ({ deptId: f.data.deptId, label: `${'　'.repeat(f.level)}${f.data.deptName}` }))
    roleOptions.value = (await listRoles({ pageNum: 1, pageSize: 100 })).rows
  } catch { /* 無部門/角色查詢權限時略過 */ }
})

// ---- 勾選 ----
const allChecked = computed(() => rows.value.length > 0 && rows.value.every((r) => selected.value.has(r.userId)))
function toggleAll(on: boolean) {
  selected.value.clear()
  if (on) for (const r of rows.value) selected.value.add(r.userId)
}
function toggleOne(id: number) {
  if (selected.value.has(id)) selected.value.delete(id)
  else selected.value.add(id)
}

// ---- 新增/修改 ----
const showEdit = ref(false)
const editId = ref<number | null>(null)
const form = reactive({
  userName: '', nickName: '', password: '', deptId: null as number | null,
  phone: '', email: '', status: '0', remark: '', roleIds: [] as number[],
})

function openCreate() {
  editId.value = null
  Object.assign(form, { userName: '', nickName: '', password: '', deptId: null, phone: '', email: '', status: '0', remark: '', roleIds: [] })
  showEdit.value = true
}
function openUpdate(row: any) {
  editId.value = row.userId
  Object.assign(form, {
    userName: row.userName, nickName: row.nickName, password: '',
    deptId: row.deptId ?? null, phone: row.phone ?? '', email: row.email ?? '',
    status: row.status, remark: row.remark ?? '', roleIds: [...row.roleIds],
  })
  showEdit.value = true
}
function openUpdateSelected() {
  const row = rows.value.find((r) => selected.value.has(r.userId))
  if (row) openUpdate(row)
}
async function save() {
  if (editId.value === null) await createUser(form)
  else await updateUser(editId.value, form)
  message(t('system.saved'))
  showEdit.value = false
  await load()
}

// ---- 狀態開關 ----
async function toggleStatus(row: any) {
  await updateUser(row.userId, {
    userName: row.userName, nickName: row.nickName, password: '',
    deptId: row.deptId ?? null, phone: row.phone, email: row.email,
    status: row.status === '0' ? '1' : '0', remark: row.remark, roleIds: [...row.roleIds],
  })
  message(t('system.statusUpdated'))
  await load()
}

// ---- 刪除(單筆/批次) ----
async function onDelete(ids: number[]) {
  if (!ids.length) return
  if (!await useConfirm(t('confirm.deleteUsers', { count: ids.length }))) return
  for (const id of ids) await deleteUser(id)
  message(t('system.deleted'))
  await load()
}

async function onResetPwd(row: any) {
  const pwd = prompt(t('system.resetPasswordPrompt', { userName: row.userName }))
  if (!pwd) return
  await resetPassword(row.userId, pwd)
  message(t('system.passwordReset'))
}

function goPage(p: number) {
  query.pageNum = p
  load()
}
</script>

<template>
  <div class="grid items-start gap-5 lg:grid-cols-[280px_1fr]">
    <!-- 部門樹 -->
    <div class="rounded bg-card p-5 shadow-sm">
      <h3 class="mb-4 text-[15px] font-semibold">{{ t('system.department') }}</h3>
      <input
        v-model="deptFilter"
        type="text"
        :placeholder="t('system.enterDepartment')"
        class="mb-3 w-full rounded border border-line px-3 py-2 text-[13px] outline-none focus:border-primary"
      />
      <DeptTree :nodes="visibleDeptTree" :selected="query.deptId" :expanded="deptExpanded" @select="onSelectDept" />
    </div>

    <!-- 使用者列表 -->
    <div class="rounded bg-card p-5 shadow-sm">
      <!-- 搜尋列 -->
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 text-[13px] text-secondary">
          {{ t('system.account') }} <input v-model="query.userName" type="text" :placeholder="t('system.enterAccount')" class="w-44 rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </label>
        <label class="flex items-center gap-2 text-[13px] text-secondary">
          {{ t('system.phone') }} <input v-model="query.phone" type="text" :placeholder="t('system.enterPhone')" class="w-44 rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </label>
        <label class="flex items-center gap-2 text-[13px] text-secondary">
          {{ t('system.status') }}
          <select v-model="query.status" class="rounded border border-line px-3 py-2 outline-none focus:border-primary">
            <option value="">{{ t('system.all') }}</option><option value="0">{{ t('system.enabled') }}</option><option value="1">{{ t('system.disabled') }}</option>
          </select>
        </label>
        <button class="rounded bg-primary px-3 py-2 text-xs text-white hover:bg-primary-hover" @click="goPage(1)">🔍 {{ t('system.search') }}</button>
        <button class="rounded border border-line px-3 py-2 text-xs text-secondary hover:border-primary hover:bg-muted hover:text-primary" @click="resetQuery">{{ t('system.reset') }}</button>
      </div>

      <!-- 工具列 -->
      <div class="mb-4 flex gap-2">
        <button v-perm="'system:user:add'" class="rounded bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary-hover" @click="openCreate">＋ {{ t('system.add') }}</button>
        <button v-perm="'system:user:edit'" :disabled="selected.size !== 1" class="rounded bg-success px-3 py-1.5 text-xs text-white hover:bg-success-hover disabled:cursor-not-allowed disabled:opacity-50" @click="openUpdateSelected">✎ {{ t('system.edit') }}</button>
        <button v-perm="'system:user:remove'" :disabled="!selected.size" class="rounded bg-danger px-3 py-1.5 text-xs text-white hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-50" @click="onDelete([...selected])">🗑 {{ t('system.delete') }}</button>
      </div>

      <table class="w-full text-[13px]">
        <thead>
          <tr class="bg-muted text-left text-secondary">
            <th class="w-8 px-2.5 py-3"><input type="checkbox" class="accent-primary" :checked="allChecked" @change="toggleAll(($event.target as HTMLInputElement).checked)" /></th>
            <th class="px-2.5 py-3 font-medium">{{ t('system.userId') }}</th><th class="px-2.5 py-3 font-medium">{{ t('system.account') }}</th>
            <th class="px-2.5 py-3 font-medium">{{ t('system.name') }}</th><th class="px-2.5 py-3 font-medium">{{ t('system.department') }}</th>
            <th class="px-2.5 py-3 font-medium">{{ t('system.role') }}</th><th class="px-2.5 py-3 font-medium">{{ t('system.phone') }}</th>
            <th class="px-2.5 py-3 font-medium">{{ t('system.status') }}</th><th class="px-2.5 py-3 font-medium">{{ t('system.createdAt') }}</th>
            <th class="px-2.5 py-3 font-medium">{{ t('system.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.userId" class="border-b border-line hover:bg-muted">
            <td class="px-2.5 py-3"><input type="checkbox" class="accent-primary" :checked="selected.has(row.userId)" @change="toggleOne(row.userId)" /></td>
            <td class="px-2.5 py-3">{{ row.userId }}</td>
            <td class="px-2.5 py-3">{{ row.userName }}</td>
            <td class="px-2.5 py-3">{{ row.nickName }}</td>
            <td class="px-2.5 py-3">{{ row.deptName ?? '—' }}</td>
            <td class="px-2.5 py-3">
              <span v-for="r in row.roles" :key="r.roleId"
                class="mr-1 rounded border px-1.5 py-0.5 text-xs"
                :class="r.roleKey === 'site_admin' ? 'border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger' : 'border-[color-mix(in_srgb,var(--info)_35%,transparent)] bg-[color-mix(in_srgb,var(--info)_12%,transparent)] text-info'"
              >{{ roleLabel(r.roleKey, r.roleName) }}</span>
              <span v-if="!row.roles.length" class="text-disabled">—</span>
            </td>
            <td class="px-2.5 py-3">{{ row.phone ?? '—' }}</td>
            <td class="px-2.5 py-3">
              <Switch :on="row.status === '0'" :disabled="demoAccounts.has(row.userName)" @toggle="toggleStatus(row)" />
            </td>
            <td class="px-2.5 py-3">{{ row.createTime ? formatDate(row.createTime) : '' }}</td>
            <td class="px-2.5 py-3 whitespace-nowrap">
              <button v-perm="'system:user:edit'" class="px-1.5 text-primary hover:underline" @click="openUpdate(row)">{{ t('system.edit') }}</button>
              <button v-if="!demoAccounts.has(row.userName)" v-perm="'system:user:resetPwd'" class="px-1.5 text-primary hover:underline" @click="onResetPwd(row)">{{ t('system.resetPassword') }}</button>
              <button v-if="!demoAccounts.has(row.userName)" v-perm="'system:user:remove'" class="px-1.5 text-danger hover:underline" @click="onDelete([row.userId])">{{ t('system.delete') }}</button>
            </td>
          </tr>
          <tr v-if="!rows.length"><td colspan="10" class="py-10 text-center text-disabled">{{ t('system.noData') }}</td></tr>
        </tbody>
      </table>

      <Pagination :total="total" :page-num="query.pageNum" :page-size="query.pageSize" @change="goPage" />

      <!-- 新增/修改 Modal -->
      <Modal :show="showEdit" :title="editId === null ? t('system.addUser') : t('system.editUser')" @close="showEdit = false" @confirm="save">
        <div class="grid grid-cols-2 gap-4 text-[13px]">
          <div>
            <label class="mb-1.5 block text-secondary"><span class="text-danger">*</span> {{ t('system.account') }}</label>
            <input v-model="form.userName" :disabled="editId !== null" type="text" :placeholder="t('system.enterAccount')" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary disabled:bg-muted" />
          </div>
          <div>
            <label class="mb-1.5 block text-secondary"><span class="text-danger">*</span> {{ t('system.name') }}</label>
            <input v-model="form.nickName" type="text" :placeholder="t('system.enterName')" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1.5 block text-secondary">{{ editId === null ? t('system.passwordRequired') : t('system.passwordUnchanged') }}</label>
            <input v-model="form.password" type="password" :placeholder="t('system.enterPassword')" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1.5 block text-secondary">{{ t('system.phoneNumber') }}</label>
            <input v-model="form.phone" type="text" :placeholder="t('system.enterPhone')" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1.5 block text-secondary">{{ t('system.assignedDepartment') }}</label>
            <select v-model="form.deptId" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary">
              <option :value="null">—</option>
              <option v-for="d in deptOptions" :key="d.deptId" :value="d.deptId">{{ d.label }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-secondary">{{ t('system.rolesMultiple') }}</label>
            <select v-model="form.roleIds" multiple class="h-24 w-full rounded border border-line px-3 py-2 outline-none focus:border-primary">
              <option v-for="r in roleOptions" :key="r.roleId" :value="r.roleId">{{ roleLabel(r.roleKey, r.roleName) }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-secondary">{{ t('system.email') }}</label>
            <input v-model="form.email" type="text" :placeholder="t('system.enterEmail')" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1.5 block text-secondary">{{ t('system.status') }}</label>
            <div class="flex gap-4 pt-2">
              <label class="flex items-center gap-1.5"><input v-model="form.status" type="radio" value="0" class="accent-primary" /> {{ t('system.enabled') }}</label>
              <label class="flex items-center gap-1.5"><input v-model="form.status" type="radio" value="1" class="accent-primary" /> {{ t('system.disabled') }}</label>
            </div>
          </div>
          <div class="col-span-2">
            <label class="mb-1.5 block text-secondary">{{ t('system.remark') }}</label>
            <textarea v-model="form.remark" :placeholder="t('system.enterRemark')" class="min-h-[70px] w-full rounded border border-line px-3 py-2 outline-none focus:border-primary"></textarea>
          </div>
        </div>
      </Modal>
    </div>
  </div>
</template>
